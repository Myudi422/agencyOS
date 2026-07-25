from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Workspace, Client, SocialAccount

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    timezone: Optional[str] = "Asia/Jakarta"
    logo_url: Optional[str] = None

@router.get("/")
def get_workspaces(db: Session = Depends(get_db)):
    """Lists all active workspaces with summary counts. Creates primary workspace if DB is empty."""
    workspaces = db.query(Workspace).all()

    # Auto-initialize primary empty workspace if none exists
    if not workspaces:
        default_ws = Workspace(
            name="Main Agency Workspace",
            slug="main-agency",
            timezone="Asia/Jakarta"
        )
        db.add(default_ws)
        db.flush()

        default_client = Client(
            workspace_id=default_ws.id,
            name="Primary Client",
            description="Default workspace client",
            brand_color="#6366f1",
            timezone="Asia/Jakarta"
        )
        db.add(default_client)
        db.commit()
        db.refresh(default_ws)
        workspaces = [default_ws]

    results = []
    for w in workspaces:
        client_count = db.query(Client).filter(Client.workspace_id == w.id).count()
        account_count = db.query(SocialAccount).filter(SocialAccount.workspace_id == w.id).count()
        results.append({
            "id": w.id,
            "name": w.name,
            "slug": w.slug,
            "timezone": w.timezone,
            "logo_url": w.logo_url,
            "client_count": client_count,
            "account_count": account_count,
            "created_at": w.created_at
        })
    return results

@router.post("/")
def create_workspace(data: WorkspaceCreate, db: Session = Depends(get_db)):
    """Creates a new Workspace."""
    existing = db.query(Workspace).filter(Workspace.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Workspace slug already exists.")

    workspace = Workspace(
        name=data.name,
        slug=data.slug,
        timezone=data.timezone or "Asia/Jakarta",
        logo_url=data.logo_url
    )
    db.add(workspace)
    db.flush()

    default_client = Client(
        workspace_id=workspace.id,
        name="Primary Client",
        description="Default client for workspace",
        brand_color="#6366f1",
        timezone=data.timezone or "Asia/Jakarta"
    )
    db.add(default_client)

    db.commit()
    db.refresh(workspace)
    return workspace
