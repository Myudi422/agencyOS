"""
Admin Router — /admin (Admin-only endpoints)
Manage users, subscription plans, app settings, and API keys.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc, asc
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


class UserSubscriptionUpdatePayload(BaseModel):
    plan_tier: Optional[str] = None
    status: Optional[str] = None  # active, expired, cancelled, trial, past_due
    expires_at: Optional[str] = None  # ISO string or timestamp
    expires_days: Optional[int] = None  # relative offset in days
    posts_limit: Optional[int] = None
    posts_used: Optional[int] = None
    is_admin: Optional[bool] = None


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users/stats")
def get_user_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: get summary statistics for user management dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.is_admin == True).scalar() or 0
    active_subs = db.query(func.count(UserSubscription.id)).filter(UserSubscription.status == SubscriptionStatus.ACTIVE).scalar() or 0
    
    # Expired count includes status == EXPIRED/CANCELLED or expires_at < now
    now = datetime.utcnow()
    expired_subs = db.query(func.count(UserSubscription.id)).filter(
        or_(
            UserSubscription.status == SubscriptionStatus.EXPIRED,
            UserSubscription.status == SubscriptionStatus.CANCELLED,
            UserSubscription.expires_at < now
        )
    ).scalar() or 0

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "active_subs": active_subs,
        "expired_subs": expired_subs,
    }


@router.get("/users")
def list_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    tier: Optional[str] = None,
    status: Optional[str] = None,
    is_admin: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List users with server-side pagination, search, and status/tier filtering."""
    query = db.query(User).options(
        joinedload(User.subscription).joinedload(UserSubscription.plan)
    )

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(User.email.ilike(s), User.full_name.ilike(s)))

    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)

    if tier or status:
        query = query.outerjoin(User.subscription).outerjoin(UserSubscription.plan)
        if tier:
            query = query.filter(SubscriptionPlan.tier == tier)
        if status:
            now = datetime.utcnow()
            if status == "expired":
                query = query.filter(
                    or_(
                        UserSubscription.status == SubscriptionStatus.EXPIRED,
                        UserSubscription.expires_at < now
                    )
                )
            else:
                query = query.filter(UserSubscription.status == status)

    total = query.count()

    # Sorting
    if sort_by == "email":
        sort_col = User.email
    elif sort_by == "full_name":
        sort_col = User.full_name
    else:
        sort_col = User.created_at

    if sort_order == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    page = max(1, page)
    limit = max(1, min(limit, 100))
    offset = (page - 1) * limit

    users = query.offset(offset).limit(limit).all()
    now = datetime.utcnow()

    result = []
    for u in users:
        sub = u.subscription
        is_sub_expired = False
        if sub and sub.expires_at and sub.expires_at < now and sub.status == SubscriptionStatus.ACTIVE:
            is_sub_expired = True

        effective_status = "expired" if is_sub_expired else (
            sub.status.value if (sub and hasattr(sub.status, "value")) else (sub.status if sub else None)
        )

        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "subscription": {
                "id": sub.id if sub else None,
                "plan_id": sub.plan_id if sub else None,
                "plan_tier": sub.plan.tier if (sub and sub.plan) else None,
                "plan_name": sub.plan.name if (sub and sub.plan) else None,
                "status": effective_status,
                "posts_used": sub.posts_used if sub else 0,
                "posts_limit": sub.posts_limit if sub else 0,
                "expires_at": sub.expires_at.isoformat() if (sub and sub.expires_at) else None,
                "started_at": sub.started_at.isoformat() if (sub and sub.started_at) else None,
            } if sub else None,
        })

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "users": result,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: delete a user from the system."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus akun admin sendiri.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    email = user.email
    db.delete(user)
    db.commit()
    return {"status": "ok", "message": f"User '{email}' berhasil dihapus."}


@router.put("/users/{user_id}/subscription")
def update_user_subscription(
    user_id: str,
    payload: UserSubscriptionUpdatePayload,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update user subscription details (tier, status, expiry, limits, and admin role)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.is_admin is not None:
        if user.id == admin.id and not payload.is_admin:
            raise HTTPException(status_code=400, detail="Anda tidak dapat mencabut akses admin milik sendiri.")
        user.is_admin = payload.is_admin

    sub = user.subscription

    if payload.plan_tier:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == payload.plan_tier).first()
        if not plan:
            raise HTTPException(status_code=404, detail=f"Plan '{payload.plan_tier}' not found.")

        posts_limit = payload.posts_limit if payload.posts_limit is not None else plan.post_quota
        
        if sub:
            sub.plan_id = plan.id
            if payload.posts_limit is None:
                sub.posts_limit = plan.post_quota
        else:
            sub = UserSubscription(
                user_id=user.id,
                plan_id=plan.id,
                status=SubscriptionStatus.ACTIVE,
                posts_used=0,
                posts_limit=posts_limit,
            )
            db.add(sub)

    if sub:
        if payload.status:
            try:
                sub.status = SubscriptionStatus(payload.status)
            except ValueError:
                sub.status = payload.status  # fallback string

        if payload.posts_limit is not None:
            sub.posts_limit = payload.posts_limit

        if payload.posts_used is not None:
            sub.posts_used = max(0, payload.posts_used)

        if payload.expires_at is not None:
            if payload.expires_at in ["", "null", "none", "Never", "never"]:
                sub.expires_at = None
            else:
                try:
                    sub.expires_at = datetime.fromisoformat(payload.expires_at.replace("Z", "+00:00"))
                except ValueError:
                    raise HTTPException(status_code=400, detail="Format tanggal expires_at tidak valid.")
        elif payload.expires_days is not None:
            if payload.expires_days == 0:
                sub.expires_at = None
            else:
                sub.expires_at = datetime.utcnow() + timedelta(days=payload.expires_days)

    db.commit()
    db.refresh(user)

    return {
        "status": "ok",
        "message": f"Data user '{user.email}' berhasil diperbarui.",
        "user_id": user.id,
        "is_admin": user.is_admin,
    }


@router.post("/users/{user_id}/override-subscription")
def override_user_subscription(
    user_id: str,
    req: SubscriptionOverrideRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: legacy route to override subscription plan."""
    return update_user_subscription(
        user_id=user_id,
        payload=UserSubscriptionUpdatePayload(
            plan_tier=req.plan_tier,
            posts_limit=req.posts_limit,
            expires_days=req.expires_days,
            status="active"
        ),
        admin=admin,
        db=db
    )


class AssignPlanByEmailRequest(BaseModel):
    email: str
    plan_tier: str
    posts_limit: Optional[int] = None
    expires_days: Optional[int] = 30  # None = never expires
    is_admin: Optional[bool] = None


@router.post("/assign-plan-by-email")
def assign_plan_by_email(
    req: AssignPlanByEmailRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: cari user by email, buat akun + workspace jika belum ada,
    lalu assign subscription plan tertentu. Cocok untuk onboarding manual.
    """
    from backend.models.models import Workspace, WorkspaceMember, RoleEnum

    # Find or create user
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(
            email=req.email,
            full_name=req.email.split("@")[0].replace(".", " ").title(),
            avatar_url=None,
            firebase_uid=None,
            is_admin=bool(req.is_admin) if req.is_admin is not None else False,
        )
        db.add(user)
        db.flush()
    else:
        if req.is_admin is not None:
            user.is_admin = req.is_admin

    # Note: We do NOT auto-create a workspace here for new users.
    # By keeping workspace=None, when the user logs in for the first time with Google,
    # verify_firebase will detect no workspace and set needs_onboarding=True.
    # This ensures the user gets to complete the Onboarding screen & Client Roster setup.

    # Find plan
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
    db.refresh(user)
    return {
        "status": "ok",
        "message": f"Plan '{plan.name}' assigned to {user.email}",
        "user_id": user.id,
        "is_admin": user.is_admin,
        "is_new_user": not user.firebase_uid,
    }



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


class InstagramTestRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    session_cookie: Optional[str] = None


@router.post("/test-instagram")
def test_instagram(
    req: Optional[InstagramTestRequest] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Test stored Instagram session cookie / credentials using instagrapi."""
    from backend.services.instagrapi_service import instagrapi_service
    u = req.username if req else None
    p = req.password if req else None
    s = req.session_cookie if req else None
    res = instagrapi_service.test_connection(db, test_session=s, username=u, password=p)
    return res


class ProxyTestRequest(BaseModel):
    proxy_url: Optional[str] = None


@router.post("/test-proxy")
def test_proxy(
    req: Optional[ProxyTestRequest] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Test proxy connectivity by querying public IP checkers."""
    from backend.services.faustren_scraper_service import faustren_scraper_service
    p_url = req.proxy_url if req and req.proxy_url else None

    if not p_url:
        # Check DB setting if not provided in payload
        url_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["PROXY_URL", "PROXY_CONNECTION_STRING"])
        ).first()
        if url_row and url_row.value:
            p_url = str(url_row.value).strip()

    if not p_url:
        return {"success": False, "message": "URL Proxy belum diisi di form atau Admin Settings."}

    return faustren_scraper_service.test_proxy_connection(p_url)


class FaustRenTestRequest(BaseModel):
    username: Optional[str] = "instagram"
    proxy_url: Optional[str] = None


@router.post("/test-faustren")
def test_faustren(
    req: Optional[FaustRenTestRequest] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Test FaustRen Instagram scraper with optional proxy override."""
    from backend.services.faustren_scraper_service import faustren_scraper_service
    sample_uname = (req.username if req and req.username else "instagram").strip()
    p_url = req.proxy_url if req and req.proxy_url else None
    return faustren_scraper_service.test_faustren_scraper(db, sample_username=sample_uname, override_proxy=p_url)



