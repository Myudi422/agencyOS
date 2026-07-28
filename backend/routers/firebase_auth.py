"""
Firebase Auth Router — /auth/firebase
Verifies Google Firebase ID Token and returns/creates AgencyOS user.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import logging

from backend.database import get_db
from backend.models.models import User, Workspace, WorkspaceMember, RoleEnum, SubscriptionPlan, UserSubscription, SubscriptionStatus, PlanTier
from backend.services.firebase_service import verify_firebase_token
from backend.config import settings

logger = logging.getLogger("FirebaseAuthRouter")
router = APIRouter(prefix="/auth/firebase", tags=["Firebase Auth"])


class FirebaseVerifyRequest(BaseModel):
    id_token: str


def get_current_user_from_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency: extracts Firebase token from Authorization header and returns DB user."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    id_token = authorization.split(" ", 1)[1]
    firebase_user = verify_firebase_token(id_token)
    if not firebase_user:
        return None
    user = db.query(User).filter(User.firebase_uid == firebase_user["firebase_uid"]).first()
    if not user:
        user = db.query(User).filter(User.email == firebase_user["email"]).first()
    return user


def require_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency: requires admin user."""
    user = get_current_user_from_token(authorization, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


def require_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency: requires authenticated user."""
    user = get_current_user_from_token(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


def get_user_workspace(
    user: "User",
    workspace_id: Optional[str],
    db: "Session"
) -> "Workspace":
    """
    Validates that `workspace_id` belongs to `user` (via WorkspaceMember).
    Admin users can access any workspace.
    Returns the Workspace object or raises 403/404.
    """
    from backend.models.models import WorkspaceMember, Workspace
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required.")

    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")

    if user.is_admin:
        return ws  # Admin bypass

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=403,
            detail="Access denied: this workspace does not belong to you."
        )
    return ws



@router.post("/verify")
async def verify_firebase(req: FirebaseVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies Firebase ID token (from Google Sign-In).
    Creates or updates AgencyOS user in DB.
    Returns user info + subscription status.
    """
    firebase_user = verify_firebase_token(req.id_token)
    if not firebase_user:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token.")

    email = firebase_user["email"]
    firebase_uid = firebase_user["firebase_uid"]
    is_admin = (email == settings.ADMIN_EMAIL)

    # Upsert user
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            full_name=firebase_user["full_name"],
            avatar_url=firebase_user["avatar_url"],
            firebase_uid=firebase_uid,
            is_admin=is_admin,
        )
        db.add(user)
        db.flush()

        # Admin gets unlimited plan + auto workspace
        if is_admin:
            ws = Workspace(
                name=f"{firebase_user['full_name'].split()[0]}'s Workspace",
                slug=f"ws-{firebase_uid[:8]}",
                timezone="Asia/Jakarta"
            )
            db.add(ws)
            db.flush()
            db.add(WorkspaceMember(
                workspace_id=ws.id,
                user_id=user.id,
                role=RoleEnum.OWNER
            ))
            trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == PlanTier.STUDIO).first()
            if trial_plan:
                sub = UserSubscription(
                    user_id=user.id,
                    plan_id=trial_plan.id,
                    status=SubscriptionStatus.ACTIVE,
                    posts_used=0,
                    posts_limit=999999,
                    expires_at=None,
                )
                db.add(sub)
        # Non-admin: no auto-workspace, they will go through onboarding
    else:
        # Update existing user
        user.firebase_uid = firebase_uid
        user.is_admin = is_admin
        if firebase_user["avatar_url"]:
            user.avatar_url = firebase_user["avatar_url"]
        if firebase_user["full_name"]:
            user.full_name = firebase_user["full_name"]

    db.commit()
    db.refresh(user)

    # Load subscription (with auto-healing fallback if inactive)
    sub = user.subscription
    is_expired = sub.expires_at and sub.expires_at < datetime.utcnow() if sub else True
    is_active = sub and sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL) and not is_expired

    subscription_data = None
    if sub:
        plan = sub.plan
        posts_remaining = max(0, sub.posts_limit - sub.posts_used)
        subscription_data = {
            "plan_tier": plan.tier,
            "plan_name": plan.name,
            "status": sub.status,
            "posts_used": sub.posts_used,
            "posts_limit": sub.posts_limit,
            "posts_remaining": posts_remaining,
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
            "is_expired": is_expired,
        }


    # Get user's workspace
    membership = user.memberships[0] if user.memberships else None
    workspace = membership.workspace if membership else None
    needs_onboarding = workspace is None and not is_admin

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_admin": user.is_admin,
        },
        "workspace": {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "timezone": workspace.timezone,
        } if workspace else None,
        "subscription": subscription_data,
        "is_admin": is_admin,
        "needs_onboarding": needs_onboarding,
    }


@router.get("/me")
async def get_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Returns current authenticated user info from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided.")

    id_token = authorization.split(" ", 1)[1]
    firebase_user = verify_firebase_token(id_token)
    if not firebase_user:
        raise HTTPException(status_code=401, detail="Invalid token.")

    user = db.query(User).filter(User.firebase_uid == firebase_user["firebase_uid"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please verify token first.")

    sub = user.subscription
    subscription_data = None
    if sub:
        plan = sub.plan
        posts_remaining = max(0, sub.posts_limit - sub.posts_used)
        is_expired = sub.expires_at and sub.expires_at < datetime.utcnow()
        subscription_data = {
            "plan_tier": plan.tier,
            "plan_name": plan.name,
            "status": sub.status,
            "posts_used": sub.posts_used,
            "posts_limit": sub.posts_limit,
            "posts_remaining": posts_remaining,
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
            "is_expired": is_expired,
        }

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_admin": user.is_admin,
        },
        "subscription": subscription_data,
        "is_admin": user.is_admin,
    }
