from fastapi import APIRouter, Depends, HTTPException, Query, Header
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import or_, desc, asc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging
from backend.database import get_db
from backend.models.models import SocialAccount, AccountPlatform, AccountStatus, ActivityLog, Client, User
from backend.routers.firebase_auth import require_user, get_user_workspace

logger = logging.getLogger("AccountsRouter")

router = APIRouter(prefix="/accounts", tags=["Social Accounts"])

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

    total = query.count()
    offset = (page - 1) * limit
    accounts = query.offset(offset).limit(limit).all()

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

    # Also delete from PostForMe if the account has a PostForMe ID
    if postforme_id:
        try:
            from backend.services.postforme_service import postforme_service
            # Use delete (permanent) to remove from PostForMe
            await postforme_service.delete_social_account(postforme_id)
            logger.info(f"Deleted PostForMe account {postforme_id} for @{acc_name}")
        except Exception as pf_err:
            # Log but don't fail — still remove from local DB
            logger.warning(f"PostForMe delete failed for {postforme_id}: {pf_err}")

    db.delete(account)
    db.add(ActivityLog(
        workspace_id=workspace_id,
        user_name=current_user.full_name,
        action="DISCONNECT_ACCOUNT",
        details=f"Disconnected social account @{acc_name} (PostForMe ID: {postforme_id})",
        entity_type="Account"
    ))
    db.commit()
    return {"status": "success", "message": "Account deleted"}
