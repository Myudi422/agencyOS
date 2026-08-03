from fastapi import APIRouter, Depends, HTTPException, Query, Header
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import or_, desc, asc, text
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging
from backend.database import get_db
from backend.models.models import SocialAccount, AccountPlatform, AccountStatus, ActivityLog, Client, User
from backend.routers.firebase_auth import require_user, get_user_workspace

logger = logging.getLogger("AccountsRouter")

router = APIRouter(prefix="/accounts", tags=["Social Accounts"])

class AccountBriefingSchema(BaseModel):
    brand_name: Optional[str] = None
    business_description: Optional[str] = None
    target_audience: Optional[str] = None
    tone_of_voice: Optional[str] = None
    content_pillars: Optional[List[str]] = None
    dos_and_donts: Optional[str] = None

class BulkActionRequest(BaseModel):
    account_ids: List[str]
    action: str  # "favorite", "unfavorite", "reconnect", "delete", "assign_group"
    group_name: Optional[str] = None

@router.get("/")
def get_accounts(
    workspace_id: str = Query(..., description="Workspace ID"),
    client_id: Optional[str] = Query(None, description="Client filter"),
    platform: Optional[str] = Query(None, description="Platform filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    search: Optional[str] = Query(None, description="Search keyword"),
    favorites_only: Optional[bool] = Query(False, description="Filter favorites"),
    group: Optional[str] = Query(None, description="Group filter"),
    sort_by: Optional[str] = Query("connected_at", description="Sort column"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Returns social accounts for the given workspace.
    Validates that workspace belongs to current user (admin bypasses check).
    """
    get_user_workspace(current_user, workspace_id, db)  # raises 403/404 if not allowed

    query = db.query(SocialAccount).filter(SocialAccount.workspace_id == workspace_id)

    if client_id:
        query = query.filter(SocialAccount.client_id == client_id)
    if platform:
        try:
            enum_platform = AccountPlatform(platform)
            query = query.filter(SocialAccount.platform == enum_platform)
        except ValueError:
            query = query.filter(SocialAccount.platform == platform)
    if status:
        query = query.filter(SocialAccount.status == AccountStatus(status))
    if favorites_only:
        query = query.filter(SocialAccount.is_favorite == True)
    if group:
        query = query.filter(SocialAccount.account_group == group)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                SocialAccount.name.ilike(search_pattern),
                SocialAccount.username.ilike(search_pattern)
            )
        )

    sort_col = getattr(SocialAccount, sort_by, SocialAccount.connected_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    try:
        total = query.count()
        offset = (page - 1) * limit
        accounts = query.offset(offset).limit(limit).all()
    except Exception as e:
        if "watermark_config" in str(e):
            db.rollback()
            db.execute(text("ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS watermark_config JSON DEFAULT '{}';"))
            db.commit()
            total = query.count()
            offset = (page - 1) * limit
            accounts = query.offset(offset).limit(limit).all()
        else:
            raise e

    clients_dict = {
        c.id: c.name for c in db.query(Client).filter(Client.workspace_id == workspace_id).all()
    }

    items = []
    for a in accounts:
        items.append({
            "id": a.id,
            "workspace_id": a.workspace_id,
            "client_id": a.client_id,
            "client_name": clients_dict.get(a.client_id, "Unknown Client"),
            "platform": a.platform.value,
            "platform_account_id": a.platform_account_id,
            "name": a.name,
            "username": a.username,
            "avatar_url": a.avatar_url,
            "status": a.status.value,
            "is_favorite": a.is_favorite,
            "account_group": a.account_group,
            "followers_count": a.followers_count,
            "briefing": a.briefing,
            "watermark_config": a.watermark_config or {},
            "last_synced_at": a.last_synced_at,
            "connected_at": a.connected_at
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


class WatermarkConfigSchema(BaseModel):
    default_mode: Optional[str] = "text"  # "image" or "text"
    text_content: Optional[str] = None
    text_color: Optional[str] = "#ffffff"
    image_url: Optional[str] = None
    position: Optional[str] = "bottom_right"  # top_left, top_center, top_right, center_left, center, center_right, bottom_left, bottom_center, bottom_right
    opacity: Optional[float] = 0.8
    scale: Optional[float] = 0.2
    margin: Optional[int] = 20


class WatermarkPreviewRequest(BaseModel):
    image_base64: str
    config: WatermarkConfigSchema


@router.get("/{account_id}/watermark")
def get_account_watermark(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    get_user_workspace(current_user, account.workspace_id, db)
    return {
        "account_id": account.id,
        "username": account.username,
        "watermark_config": account.watermark_config or {}
    }


@router.put("/{account_id}/watermark")
def update_account_watermark(
    account_id: str,
    payload: WatermarkConfigSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    get_user_workspace(current_user, account.workspace_id, db)

    config_data = payload.dict(exclude_unset=True)
    config_data["updated_at"] = datetime.utcnow().isoformat()

    # Sync watermark config to ALL matching social account instances across workspaces (Single Source of Truth)
    matching_accounts = db.query(SocialAccount).filter(
        SocialAccount.platform == account.platform,
        SocialAccount.username == account.username
    ).all()

    for acc in matching_accounts:
        acc.watermark_config = config_data

    db.commit()

    return {
        "account_id": account.id,
        "status": "success",
        "synced_count": len(matching_accounts),
        "watermark_config": account.watermark_config
    }


@router.post("/watermark/preview")
def preview_watermark(
    payload: WatermarkPreviewRequest,
    current_user: User = Depends(require_user)
):
    """Returns a base64 data URI of the watermarked image for frontend live preview."""
    try:
        from backend.services.watermark_service import watermark_service
        b64_res = watermark_service.preview_watermark_base64(
            payload.image_base64.encode("utf-8") if isinstance(payload.image_base64, str) else payload.image_base64,
            payload.config.dict()
        )
        return {"status": "success", "preview_data_uri": b64_res}
    except Exception as e:
        logger.error(f"Watermark preview error: {e}")
        raise HTTPException(status_code=400, detail=f"Watermark preview failed: {str(e)}")


@router.get("/{account_id}/briefing")
def get_account_briefing(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    get_user_workspace(current_user, account.workspace_id, db)

    # Inherit briefing from sibling account if empty
    briefing = account.briefing
    if not briefing:
        sibling = db.query(SocialAccount).filter(
            SocialAccount.platform == account.platform,
            SocialAccount.username == account.username,
            SocialAccount.briefing.isnot(None)
        ).first()
        if sibling:
            briefing = sibling.briefing

    return {
        "account_id": account.id,
        "username": account.username,
        "platform": account.platform.value,
        "briefing": briefing or {}
    }

@router.put("/{account_id}/briefing")
def update_account_briefing(
    account_id: str,
    payload: AccountBriefingSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    get_user_workspace(current_user, account.workspace_id, db)

    briefing_data = payload.dict(exclude_unset=True)
    briefing_data["updated_at"] = datetime.utcnow().isoformat()

    # Sync briefing to ALL matching social account instances across workspaces (Single Source of Truth)
    matching_accounts = db.query(SocialAccount).filter(
        SocialAccount.platform == account.platform,
        SocialAccount.username == account.username
    ).all()

    for acc in matching_accounts:
        acc.briefing = briefing_data

    db.commit()

    return {
        "account_id": account.id,
        "status": "success",
        "synced_count": len(matching_accounts),
        "briefing": account.briefing
    }

@router.post("/{account_id}/favorite")
def toggle_favorite_post(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    get_user_workspace(current_user, account.workspace_id, db)
    account.is_favorite = not account.is_favorite
    db.commit()
    return {"id": account.id, "is_favorite": account.is_favorite}

@router.put("/{account_id}/favorite")
def toggle_favorite_put(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    get_user_workspace(current_user, account.workspace_id, db)
    account.is_favorite = not account.is_favorite
    db.commit()
    return {"id": account.id, "is_favorite": account.is_favorite}

@router.post("/bulk-action")
def bulk_action(
    data: BulkActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Executes bulk updates across selected account IDs."""
    accounts = db.query(SocialAccount).filter(SocialAccount.id.in_(data.account_ids)).all()
    if not accounts:
        raise HTTPException(status_code=400, detail="No matching accounts found")

    # Validate all accounts belong to user's workspaces
    for a in accounts:
        get_user_workspace(current_user, a.workspace_id, db)

    updated_count = len(accounts)

    if data.action == "favorite":
        for a in accounts:
            a.is_favorite = True
    elif data.action == "unfavorite":
        for a in accounts:
            a.is_favorite = False
    elif data.action == "reconnect":
        for a in accounts:
            a.status = AccountStatus.CONNECTED
            a.last_synced_at = datetime.utcnow()
    elif data.action == "assign_group":
        for a in accounts:
            a.account_group = data.group_name
    elif data.action == "delete":
        for a in accounts:
            db.delete(a)
        db.commit()
        return {"status": "success", "message": f"Deleted {updated_count} accounts"}
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action: {data.action}")

    db.commit()
    return {"status": "success", "message": f"Successfully performed {data.action} on {updated_count} accounts"}

@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Validate ownership
    get_user_workspace(current_user, account.workspace_id, db)

    workspace_id = account.workspace_id
    acc_name = account.username
    postforme_id = account.postforme_account_id

    # Check if any OTHER workspace is still using this social account before deleting on PostForMe API
    other_workspace_using = db.query(SocialAccount).filter(
        SocialAccount.id != account_id,
        (SocialAccount.platform == account.platform) & (SocialAccount.username == account.username)
    ).first()

    if postforme_id and not other_workspace_using:
        try:
            from backend.services.postforme_service import postforme_service
            # Delete from PostForMe ONLY if no other workspace is using it
            await postforme_service.delete_social_account(postforme_id)
            logger.info(f"Deleted PostForMe account {postforme_id} for @{acc_name} (no other workspace active)")
        except Exception as pf_err:
            logger.warning(f"PostForMe delete failed for {postforme_id}: {pf_err}")
    else:
        logger.info(f"Preserved PostForMe account @{acc_name} because another workspace is still using it.")

    db.delete(account)
    db.add(ActivityLog(
        workspace_id=workspace_id,
        user_name=current_user.full_name,
        action="DISCONNECT_ACCOUNT",
        details=f"Disconnected social account @{acc_name} from workspace",
        entity_type="Account"
    ))
    db.commit()
    return {"status": "success", "message": "Account disconnected from your workspace"}
