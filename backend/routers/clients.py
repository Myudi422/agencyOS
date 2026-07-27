from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Client, SocialAccount, User
from backend.routers.firebase_auth import require_user, get_user_workspace

router = APIRouter(prefix="/clients", tags=["Clients"])

class ClientCreate(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    timezone: Optional[str] = "UTC"
    brand_color: Optional[str] = "#6366f1"

@router.get("/")
def get_clients(
    workspace_id: str = Query(..., description="Workspace filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Retrieves all clients under a workspace owned by the current user."""
    get_user_workspace(current_user, workspace_id, db)

    clients = db.query(Client).filter(Client.workspace_id == workspace_id).all()
    results = []
    for c in clients:
        accounts = db.query(SocialAccount).filter(SocialAccount.client_id == c.id).all()
        results.append({
            "id": c.id,
            "workspace_id": c.workspace_id,
            "name": c.name,
            "description": c.description,
            "logo_url": c.logo_url,
            "timezone": c.timezone,
            "brand_color": c.brand_color,
            "account_count": len(accounts),
            "accounts": [
                {
                    "id": a.id,
                    "platform": a.platform.value,
                    "username": a.username,
                    "name": a.name,
                    "avatar_url": a.avatar_url,
                    "status": a.status.value
                } for a in accounts
            ],
            "created_at": c.created_at
        })
    return results

@router.post("/")
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Creates a new client under a workspace owned by the current user."""
    get_user_workspace(current_user, data.workspace_id, db)

    client = Client(
        workspace_id=data.workspace_id,
        name=data.name,
        description=data.description,
        logo_url=data.logo_url,
        timezone=data.timezone or "UTC",
        brand_color=data.brand_color or "#6366f1"
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}")
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    get_user_workspace(current_user, client.workspace_id, db)
    db.delete(client)
    db.commit()
    return {"status": "success", "message": "Client deleted"}
