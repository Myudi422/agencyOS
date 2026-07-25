from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.database import get_db
from backend.models.models import SocialAccount, AccountPlatform, AccountStatus, ActivityLog, Client

router = APIRouter(prefix="/accounts", tags=["Social Accounts"])

class BulkActionRequest(BaseModel):
    account_ids: List[str]
    action: str # "favorite", "unfavorite", "reconnect", "delete", "assign_group"
    group_name: Optional[str] = None

@router.get("/")
def get_accounts(
    workspace_id: str = Query(..., description="Workspace ID"),
    client_id: Optional[str] = Query(None, description="Client filter"),
    platform: Optional[str] = Query(None, description="Platform filter (instagram_business, facebook_page)"),
    status: Optional[str] = Query(None, description="Status filter (connected, disconnected, expired, need_reconnect)"),
    search: Optional[str] = Query(None, description="Search keyword for name or username"),
    favorites_only: Optional[bool] = Query(False, description="Filter favorites"),
    group: Optional[str] = Query(None, description="Group filter"),
    sort_by: Optional[str] = Query("connected_at", description="Sort column (name, username, followers_count, connected_at, status)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    High performance accounts API supporting search, multi-filters, sorting, 
    grouping, bulk selections, and fast pagination for 500+ accounts.
    """
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

    # Sorting
    sort_col = getattr(SocialAccount, sort_by, SocialAccount.connected_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    total = query.count()
    offset = (page - 1) * limit
    accounts = query.offset(offset).limit(limit).all()

    # Client mapping helper
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
def toggle_favorite(account_id: str, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_favorite = not account.is_favorite
    db.commit()
    return {"id": account.id, "is_favorite": account.is_favorite}

@router.post("/bulk-action")
def bulk_action(data: BulkActionRequest, db: Session = Depends(get_db)):
    """Executes bulk updates across selected account IDs."""
    accounts = db.query(SocialAccount).filter(SocialAccount.id.in_(data.account_ids)).all()
    if not accounts:
        raise HTTPException(status_code=400, detail="No matching accounts found")

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
def delete_account(account_id: str, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    workspace_id = account.workspace_id
    acc_name = account.username

    db.delete(account)
    db.add(ActivityLog(
        workspace_id=workspace_id,
        action="DISCONNECT_ACCOUNT",
        details=f"Disconnected social account @{acc_name}",
        entity_type="Account"
    ))
    db.commit()
    return {"status": "success", "message": "Account deleted"}
