from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Workspace, Client, SocialAccount, WorkspaceMember
from backend.routers.firebase_auth import require_user, get_user_workspace
from backend.models.models import User

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    timezone: Optional[str] = "Asia/Jakarta"
    logo_url: Optional[str] = None

@router.get("/")
def get_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Lists workspaces belonging to the authenticated user (via WorkspaceMember).
    Admin users see all workspaces.
    Auto-creates a primary workspace if none exists for the user.
    """
    if current_user.is_admin:
        workspaces = db.query(Workspace).all()
    else:
        memberships = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == current_user.id
        ).all()
        ws_ids = [m.workspace_id for m in memberships]
        workspaces = db.query(Workspace).filter(Workspace.id.in_(ws_ids)).all()

    # Auto-initialize workspace if user has none
    if not workspaces:
        name_part = current_user.full_name.split()[0] if current_user.full_name else "My"
        slug_base = f"ws-{current_user.id[:8]}"
        default_ws = Workspace(
            name=f"{name_part}'s Workspace",
            slug=slug_base,
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

        member = WorkspaceMember(
            workspace_id=default_ws.id,
            user_id=current_user.id,
            role="owner"
        )
        db.add(member)
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
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Creates a new Workspace and adds the creator as OWNER member."""
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

    # Add creator as owner member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(member)

    db.commit()
    db.refresh(workspace)
    return workspace


class OnboardingSetupRequest(BaseModel):
    workspace_name: str
    agency_type: Optional[str] = "agency"  # freelancer, agency, brand, studio
    timezone: Optional[str] = "Asia/Jakarta"
    first_client_name: Optional[str] = None


@router.post("/setup")
def setup_onboarding_workspace(
    data: OnboardingSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Onboarding endpoint — creates the first workspace for a new user.
    Validates user doesn't already have a workspace.
    Returns workspace + client info for frontend to save in state.
    """
    # Check if user already has a workspace
    existing_membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id
    ).first()
    if existing_membership:
        # Already has workspace — just return it
        ws = db.query(Workspace).filter(Workspace.id == existing_membership.workspace_id).first()
        client = db.query(Client).filter(Client.workspace_id == ws.id).first()
        return {
            "workspace": {"id": ws.id, "name": ws.name, "slug": ws.slug, "timezone": ws.timezone},
            "client": {"id": client.id, "name": client.name} if client else None,
            "already_existed": True
        }

    # Generate unique slug
    import re
    base_slug = re.sub(r"[^a-z0-9]+", "-", data.workspace_name.lower()).strip("-")[:40]
    slug = base_slug
    counter = 1
    while db.query(Workspace).filter(Workspace.id == slug or Workspace.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    workspace = Workspace(
        name=data.workspace_name,
        slug=slug,
        timezone=data.timezone or "Asia/Jakarta"
    )
    db.add(workspace)
    db.flush()

    # Add creator as OWNER
    db.add(WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner"
    ))

    # Create default client
    client_name = data.first_client_name or "Primary Client"
    client = Client(
        workspace_id=workspace.id,
        name=client_name,
        description=f"Default client for {data.workspace_name}",
        brand_color="#6366f1",
        timezone=data.timezone or "Asia/Jakarta"
    )
    db.add(client)

    db.commit()
    db.refresh(workspace)
    db.refresh(client)

    return {
        "workspace": {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "timezone": workspace.timezone,
        },
        "client": {
            "id": client.id,
            "name": client.name,
        },
        "already_existed": False
    }
