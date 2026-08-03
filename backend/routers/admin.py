"""
Admin Router — /admin (Admin-only endpoints)
Manage users, subscription plans, app settings, and API keys.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from datetime import datetime, timedelta
import logging

from backend.database import get_db
from backend.models.models import (
    User, SubscriptionPlan, UserSubscription, SubscriptionStatus, PlanTier, Setting
)
from backend.config import settings

logger = logging.getLogger("AdminRouter")
router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Auth Dependency ──────────────────────────────────────────────────────────

def require_admin(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    from backend.services.firebase_service import verify_firebase_token
    id_token = authorization.split(" ", 1)[1]
    firebase_user = verify_firebase_token(id_token)
    if not firebase_user:
        raise HTTPException(status_code=401, detail="Invalid token.")
    user = db.query(User).filter(User.firebase_uid == firebase_user["firebase_uid"]).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class PlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_usd: Optional[float] = None
    price_idr: Optional[int] = None
    post_quota: Optional[int] = None
    duration_days: Optional[int] = None
    is_active: Optional[bool] = None
    features: Optional[List[str]] = None


class SettingUpsertRequest(BaseModel):
    key: str
    value: Any


class SubscriptionOverrideRequest(BaseModel):
    plan_tier: str
    posts_limit: Optional[int] = None
    expires_days: Optional[int] = 30  # None = never


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users with subscription info."""
    users = db.query(User).offset(skip).limit(limit).all()
    result = []
    for u in users:
        sub = u.subscription
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat(),
            "subscription": {
                "plan_tier": sub.plan.tier if sub else None,
                "plan_name": sub.plan.name if sub else None,
                "status": sub.status if sub else None,
                "posts_used": sub.posts_used if sub else 0,
                "posts_limit": sub.posts_limit if sub else 0,
                "expires_at": sub.expires_at.isoformat() if sub and sub.expires_at else None,
            } if sub else None,
        })
    return {"users": result, "total": db.query(User).count()}


@router.post("/users/{user_id}/override-subscription")
def override_user_subscription(
    user_id: str,
    req: SubscriptionOverrideRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: manually set a user's subscription plan."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == req.plan_tier).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{req.plan_tier}' not found.")

    posts_limit = req.posts_limit or plan.post_quota
    expires_at = datetime.utcnow() + timedelta(days=req.expires_days) if req.expires_days else None

    sub = user.subscription
    if sub:
        sub.plan_id = plan.id
        sub.status = SubscriptionStatus.ACTIVE
        sub.posts_used = 0
        sub.posts_limit = posts_limit
        sub.expires_at = expires_at
    else:
        sub = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            posts_used=0,
            posts_limit=posts_limit,
            expires_at=expires_at,
        )
        db.add(sub)

    db.commit()
    return {"status": "ok", "message": f"Subscription overridden to {req.plan_tier} for {user.email}"}


# ─── Plans Management ─────────────────────────────────────────────────────────

@router.get("/plans")
def get_plans(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all plans (including inactive)."""
    plans = db.query(SubscriptionPlan).all()
    tier_order = {"trial": 1, "creator": 2, "agency": 3, "studio": 4}
    plans_sorted = sorted(plans, key=lambda p: tier_order.get(p.tier.value if hasattr(p.tier, "value") else str(p.tier), 99))
    return [
        {
            "id": p.id,
            "tier": p.tier,
            "name": p.name,
            "description": p.description,
            "price_usd": p.price_usd,
            "price_idr": p.price_idr,
            "duration_days": p.duration_days,
            "post_quota": p.post_quota,
            "is_active": p.is_active,
            "features": p.features or [],
        }
        for p in plans_sorted
    ]


@router.put("/plans/{plan_id}")
def update_plan(
    plan_id: str,
    req: PlanUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a subscription plan's pricing or quota."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    if req.name is not None:
        plan.name = req.name
    if req.description is not None:
        plan.description = req.description
    if req.price_usd is not None:
        plan.price_usd = req.price_usd
    if req.price_idr is not None:
        plan.price_idr = req.price_idr
    if req.post_quota is not None:
        plan.post_quota = req.post_quota
    if req.duration_days is not None:
        plan.duration_days = req.duration_days
    if req.is_active is not None:
        plan.is_active = req.is_active
    if req.features is not None:
        plan.features = req.features

    plan.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "ok", "plan_id": plan_id}


# ─── App Settings ─────────────────────────────────────────────────────────────

GLOBAL_WS_ID = "global"

@router.get("/settings")
def get_settings(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Get all global app settings (API keys, config)."""
    settings_rows = db.query(Setting).filter(Setting.workspace_id == GLOBAL_WS_ID).all()
    return {s.key: s.value for s in settings_rows}


@router.put("/settings")
def upsert_setting(
    req: SettingUpsertRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Upsert a global app setting (API key, config value, etc.)."""
    existing = db.query(Setting).filter(
        Setting.workspace_id == GLOBAL_WS_ID,
        Setting.key == req.key
    ).first()

    if existing:
        existing.value = req.value
        existing.updated_at = datetime.utcnow()
    else:
        new_setting = Setting(
            workspace_id=GLOBAL_WS_ID,
            key=req.key,
            value=req.value,
        )
        db.add(new_setting)

    db.commit()
    return {"status": "ok", "key": req.key}


@router.delete("/settings/{key}")
def delete_setting(
    key: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a global app setting."""
    setting = db.query(Setting).filter(
        Setting.workspace_id == GLOBAL_WS_ID,
        Setting.key == key
    ).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found.")
    db.delete(setting)
    db.commit()
    return {"status": "deleted", "key": key}


@router.post("/test-gemini")
async def test_gemini(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Test Gemini WebAPI cookie or API Key connection."""
    from backend.services.gemini_service import gemini_service
    res = await gemini_service.test_connection(db)
    return res


@router.post("/test-instagram")
def test_instagram(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Test stored Instagram session cookie / credentials using instagrapi."""
    from backend.services.instagrapi_service import instagrapi_service
    res = instagrapi_service.test_connection(db)
    return res


