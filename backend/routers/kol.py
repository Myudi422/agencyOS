"""
KOL Campaign & Deliverable Tracker Router — /kol
Endpoints for managing KOL master profiles, per-connected-account campaigns,
deliverable checklists, and real-time campaign ROI calculation.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, List, Any, Dict
from datetime import datetime
import logging

from backend.database import get_db
from backend.models.models import (
    User, Workspace, WorkspaceMember, SocialAccount, ActivityLog,
    AccountPlatform, KolProfile, KolCampaign, KolCampaignKol, KolDeliverable,
    KolCampaignStatus, KolDeliverableType, KolDeliverableStatus, KolPaymentStatus
)
from backend.services.firebase_service import verify_firebase_token
from backend.services.redis_service import cache_get, cache_set, cache_delete_prefix

logger = logging.getLogger("KolRouter")
router = APIRouter(prefix="/kol", tags=["KOL Manager"])

_CACHE_TTL = 180  # 3 minutes cache for list endpoints


# ─── Auth Dependency ──────────────────────────────────────────────────────────

def get_current_user_and_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> tuple[User, Workspace]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    id_token = authorization.split(" ", 1)[1]
    firebase_user = verify_firebase_token(id_token)
    if not firebase_user:
        raise HTTPException(status_code=401, detail="Invalid token.")

    user = db.query(User).filter(User.firebase_uid == firebase_user["firebase_uid"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    if not x_workspace_id:
        membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
        if not membership:
            raise HTTPException(status_code=404, detail="User has no workspace assigned.")
        workspace_id = membership.workspace_id
    else:
        workspace_id = x_workspace_id

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    return user, workspace


# ─── Pydantic Request Schemas ──────────────────────────────────────────────────

class KolProfileCreate(BaseModel):
    name: str
    username: str
    primary_platform: str = "instagram"
    niche: Optional[str] = None
    tier: str = "micro"  # nano, micro, macro, mega
    followers_count: int = 0
    engagement_rate: float = 0.0
    avg_views: Optional[int] = None
    contact_name: Optional[str] = None
    contact_wa: Optional[str] = None
    contact_email: Optional[str] = None
    rate_card: Dict[str, Any] = Field(default_factory=dict)
    profile_pic_url: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class KolProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    primary_platform: Optional[str] = None
    niche: Optional[str] = None
    tier: Optional[str] = None
    followers_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    avg_views: Optional[int] = None
    contact_name: Optional[str] = None
    contact_wa: Optional[str] = None
    contact_email: Optional[str] = None
    rate_card: Optional[Dict[str, Any]] = None
    profile_pic_url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class BlacklistRequest(BaseModel):
    is_blacklisted: bool
    blacklist_reason: Optional[str] = None

class CampaignCreate(BaseModel):
    social_account_id: str
    name: str
    description: Optional[str] = None
    status: str = "draft"  # draft, active, completed, paused, cancelled
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_budget: float = 0.0
    estimated_revenue: Optional[float] = None
    campaign_brief_url: Optional[str] = None
    hashtag_mandatory: Optional[str] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_budget: Optional[float] = None
    estimated_revenue: Optional[float] = None
    campaign_brief_url: Optional[str] = None
    hashtag_mandatory: Optional[str] = None

class CampaignKolAdd(BaseModel):
    kol_profile_id: str
    agreed_rate: float = 0.0
    payment_status: str = "unpaid"  # unpaid, partial, paid
    paid_amount: float = 0.0
    notes: Optional[str] = None

class CampaignKolUpdate(BaseModel):
    agreed_rate: Optional[float] = None
    payment_status: Optional[str] = None
    paid_amount: Optional[float] = None
    notes: Optional[str] = None

class DeliverableCreate(BaseModel):
    campaign_kol_id: str
    deliverable_type: str = "ig_reels"
    title: str
    status: str = "pending"
    due_date: Optional[str] = None
    content_url: Optional[str] = None
    review_notes: Optional[str] = None

class DeliverableUpdate(BaseModel):
    deliverable_type: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    content_url: Optional[str] = None
    review_notes: Optional[str] = None


# ─── Endpoints: Connected Platform Accounts ───────────────────────────────────

@router.get("/platform-accounts")
def list_platform_accounts(
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    List connected platform accounts in current workspace with active campaign counts.
    Mirrors the account selector pattern of Competitor Spy.
    """
    _, workspace = ctx
    accounts = db.query(SocialAccount).filter(
        SocialAccount.workspace_id == workspace.id
    ).all()

    result = []
    for a in accounts:
        campaigns_count = db.query(KolCampaign).filter(
            KolCampaign.social_account_id == a.id
        ).count()
        
        active_campaigns_count = db.query(KolCampaign).filter(
            KolCampaign.social_account_id == a.id,
            KolCampaign.status == KolCampaignStatus.ACTIVE
        ).count()

        result.append({
            "id": a.id,
            "username": a.username,
            "name": a.name,
            "platform": a.platform.value if hasattr(a.platform, "value") else str(a.platform),
            "avatar_url": a.avatar_url,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "followers_count": a.followers_count,
            "campaigns_count": campaigns_count,
            "active_campaigns_count": active_campaigns_count
        })

    return {"accounts": result, "total": len(result)}


# ─── Endpoints: KOL Master Profiles ───────────────────────────────────────────

@router.get("/profiles")
def list_kol_profiles(
    niche: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    blacklisted: Optional[bool] = Query(None),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    List all master KOL profiles in workspace. Cached 3 min in Redis.
    """
    _, workspace = ctx
    cache_key = f"kol:profiles:{workspace.id}:{niche}:{tier}:{platform}:{search}:{blacklisted}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    query = db.query(KolProfile).filter(KolProfile.workspace_id == workspace.id)

    if niche:
        query = query.filter(KolProfile.niche.ilike(f"%{niche}%"))
    if tier:
        query = query.filter(KolProfile.tier == tier)
    if platform:
        query = query.filter(KolProfile.primary_platform == platform)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (KolProfile.name.ilike(search_fmt)) | (KolProfile.username.ilike(search_fmt))
        )
    if blacklisted is not None:
        query = query.filter(KolProfile.is_blacklisted == blacklisted)

    profiles = query.order_by(KolProfile.followers_count.desc()).all()

    result = []
    for p in profiles:
        result.append({
            "id": p.id,
            "workspace_id": p.workspace_id,
            "name": p.name,
            "username": p.username,
            "primary_platform": p.primary_platform.value if hasattr(p.primary_platform, "value") else str(p.primary_platform),
            "niche": p.niche,
            "tier": p.tier,
            "followers_count": p.followers_count,
            "engagement_rate": p.engagement_rate,
            "avg_views": p.avg_views,
            "contact_name": p.contact_name,
            "contact_wa": p.contact_wa,
            "contact_email": p.contact_email,
            "rate_card": p.rate_card or {},
            "profile_pic_url": p.profile_pic_url,
            "notes": p.notes,
            "is_blacklisted": p.is_blacklisted,
            "blacklist_reason": p.blacklist_reason,
            "tags": p.tags or [],
            "campaigns_count": len(p.campaign_kols) if p.campaign_kols else 0,
            "created_at": p.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if p.created_at else None
        })

    payload = {"profiles": result, "total": len(result)}
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


@router.post("/profiles")
def create_kol_profile(
    req: KolProfileCreate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    user, workspace = ctx
    clean_username = req.username.strip().lstrip("@").lower()

    if not clean_username:
        raise HTTPException(status_code=400, detail="Username KOL tidak boleh kosong.")

    # Check duplicate
    existing = db.query(KolProfile).filter(
        KolProfile.workspace_id == workspace.id,
        KolProfile.username == clean_username
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"KOL @{clean_username} sudah ada di database workspace.")

    profile = KolProfile(
        workspace_id=workspace.id,
        name=req.name.strip(),
        username=clean_username,
        primary_platform=req.primary_platform,
        niche=req.niche.strip() if req.niche else None,
        tier=req.tier.lower(),
        followers_count=req.followers_count,
        engagement_rate=req.engagement_rate,
        avg_views=req.avg_views,
        contact_name=req.contact_name,
        contact_wa=req.contact_wa,
        contact_email=req.contact_email,
        rate_card=req.rate_card,
        profile_pic_url=req.profile_pic_url,
        notes=req.notes,
        tags=req.tags
    )
    db.add(profile)

    # Activity log
    log = ActivityLog(
        workspace_id=workspace.id,
        user_name=user.full_name,
        action="CREATE_KOL_PROFILE",
        details=f"Menambahkan KOL @{profile.username} ({profile.name}) ke database master",
        entity_type="KolProfile",
        entity_id=profile.id
    )
    db.add(log)
    db.commit()
    db.refresh(profile)

    cache_delete_prefix(f"kol:profiles:{workspace.id}")

    return {"status": "ok", "message": f"KOL @{profile.username} berhasil dibuat.", "id": profile.id}


@router.get("/profiles/{kol_id}")
def get_kol_profile_detail(
    kol_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    profile = db.query(KolProfile).filter(
        KolProfile.id == kol_id,
        KolProfile.workspace_id == workspace.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profil KOL tidak ditemukan.")

    campaign_history = []
    for ckol in profile.campaign_kols:
        campaign = ckol.campaign
        if campaign:
            campaign_history.append({
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "status": campaign.status.value if hasattr(campaign.status, "value") else str(campaign.status),
                "agreed_rate": ckol.agreed_rate,
                "payment_status": ckol.payment_status.value if hasattr(ckol.payment_status, "value") else str(ckol.payment_status),
                "paid_amount": ckol.paid_amount,
                "deliverables_count": len(ckol.deliverables) if ckol.deliverables else 0
            })

    return {
        "id": profile.id,
        "name": profile.name,
        "username": profile.username,
        "primary_platform": profile.primary_platform.value if hasattr(profile.primary_platform, "value") else str(profile.primary_platform),
        "niche": profile.niche,
        "tier": profile.tier,
        "followers_count": profile.followers_count,
        "engagement_rate": profile.engagement_rate,
        "avg_views": profile.avg_views,
        "contact_name": profile.contact_name,
        "contact_wa": profile.contact_wa,
        "contact_email": profile.contact_email,
        "rate_card": profile.rate_card or {},
        "profile_pic_url": profile.profile_pic_url,
        "notes": profile.notes,
        "is_blacklisted": profile.is_blacklisted,
        "blacklist_reason": profile.blacklist_reason,
        "tags": profile.tags or [],
        "campaign_history": campaign_history,
        "created_at": profile.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if profile.created_at else None
    }


@router.put("/profiles/{kol_id}")
def update_kol_profile(
    kol_id: str,
    req: KolProfileUpdate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    user, workspace = ctx
    profile = db.query(KolProfile).filter(
        KolProfile.id == kol_id,
        KolProfile.workspace_id == workspace.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profil KOL tidak ditemukan.")

    if req.name is not None:
        profile.name = req.name.strip()
    if req.username is not None:
        profile.username = req.username.strip().lstrip("@").lower()
    if req.primary_platform is not None:
        profile.primary_platform = req.primary_platform
    if req.niche is not None:
        profile.niche = req.niche.strip()
    if req.tier is not None:
        profile.tier = req.tier.lower()
    if req.followers_count is not None:
        profile.followers_count = req.followers_count
    if req.engagement_rate is not None:
        profile.engagement_rate = req.engagement_rate
    if req.avg_views is not None:
        profile.avg_views = req.avg_views
    if req.contact_name is not None:
        profile.contact_name = req.contact_name
    if req.contact_wa is not None:
        profile.contact_wa = req.contact_wa
    if req.contact_email is not None:
        profile.contact_email = req.contact_email
    if req.rate_card is not None:
        profile.rate_card = req.rate_card
    if req.profile_pic_url is not None:
        profile.profile_pic_url = req.profile_pic_url
    if req.notes is not None:
        profile.notes = req.notes
    if req.tags is not None:
        profile.tags = req.tags

    profile.updated_at = datetime.utcnow()
    db.commit()

    cache_delete_prefix(f"kol:profiles:{workspace.id}")
    return {"status": "ok", "message": f"Profil KOL @{profile.username} berhasil diperbarui."}


@router.delete("/profiles/{kol_id}")
def delete_kol_profile(
    kol_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    user, workspace = ctx
    profile = db.query(KolProfile).filter(
        KolProfile.id == kol_id,
        KolProfile.workspace_id == workspace.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profil KOL tidak ditemukan.")

    username = profile.username
    db.delete(profile)
    db.commit()

    cache_delete_prefix(f"kol:profiles:{workspace.id}")
    return {"status": "ok", "message": f"KOL @{username} berhasil dihapus dari database."}


@router.post("/profiles/{kol_id}/blacklist")
def toggle_kol_blacklist(
    kol_id: str,
    req: BlacklistRequest,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    profile = db.query(KolProfile).filter(
        KolProfile.id == kol_id,
        KolProfile.workspace_id == workspace.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profil KOL tidak ditemukan.")

    profile.is_blacklisted = req.is_blacklisted
    profile.blacklist_reason = req.blacklist_reason if req.is_blacklisted else None
    profile.updated_at = datetime.utcnow()
    db.commit()

    cache_delete_prefix(f"kol:profiles:{workspace.id}")
    action_text = "diblacklist" if req.is_blacklisted else "dihapus dari blacklist"
    return {"status": "ok", "message": f"KOL @{profile.username} berhasil {action_text}."}


# ─── Endpoints: KOL Campaigns ─────────────────────────────────────────────────

@router.get("/campaigns")
def list_campaigns(
    social_account_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    List campaigns scoped by social_account_id (or all in workspace) and optional status.
    Cached 3 min in Redis.
    """
    _, workspace = ctx
    cache_key = f"kol:campaigns:{workspace.id}:{social_account_id or 'all'}:{status or 'all'}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    query = db.query(KolCampaign).filter(KolCampaign.workspace_id == workspace.id)

    if social_account_id:
        query = query.filter(KolCampaign.social_account_id == social_account_id)
    if status:
        query = query.filter(KolCampaign.status == status)

    campaigns = query.order_by(KolCampaign.created_at.desc()).all()

    result = []
    for c in campaigns:
        # Calculate summary metrics
        total_kols = len(c.campaign_kols) if c.campaign_kols else 0
        total_deliverables = 0
        approved_deliverables = 0
        total_agreed = 0.0
        total_paid = 0.0

        kol_avatars = []
        for ckol in c.campaign_kols or []:
            total_agreed += ckol.agreed_rate or 0.0
            total_paid += ckol.paid_amount or 0.0
            if ckol.kol_profile:
                if ckol.kol_profile.profile_pic_url and len(kol_avatars) < 4:
                    kol_avatars.append(ckol.kol_profile.profile_pic_url)
            
            for d in ckol.deliverables or []:
                total_deliverables += 1
                if d.status == KolDeliverableStatus.APPROVED:
                    approved_deliverables += 1

        # Calculate estimated ROI
        roi_percentage = 0.0
        if c.total_budget > 0 and c.estimated_revenue:
            roi_percentage = round(((c.estimated_revenue - c.total_budget) / c.total_budget) * 100, 1)

        social_acc = c.social_account
        result.append({
            "id": c.id,
            "workspace_id": c.workspace_id,
            "social_account_id": c.social_account_id,
            "social_account": {
                "id": social_acc.id,
                "username": social_acc.username,
                "name": social_acc.name,
                "platform": social_acc.platform.value if hasattr(social_acc.platform, "value") else str(social_acc.platform),
                "avatar_url": social_acc.avatar_url
            } if social_acc else None,
            "name": c.name,
            "description": c.description,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "start_date": c.start_date.strftime("%Y-%m-%d") if c.start_date else None,
            "end_date": c.end_date.strftime("%Y-%m-%d") if c.end_date else None,
            "total_budget": c.total_budget,
            "total_agreed_rate": total_agreed,
            "total_paid_amount": total_paid,
            "estimated_revenue": c.estimated_revenue,
            "roi_percentage": roi_percentage,
            "campaign_brief_url": c.campaign_brief_url,
            "hashtag_mandatory": c.hashtag_mandatory,
            "total_kols": total_kols,
            "kol_avatars": kol_avatars,
            "deliverables_summary": {
                "total": total_deliverables,
                "approved": approved_deliverables,
                "completion_rate": round((approved_deliverables / total_deliverables * 100), 1) if total_deliverables > 0 else 0.0
            },
            "created_at": c.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if c.created_at else None
        })

    payload = {"campaigns": result, "total": len(result)}
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


@router.post("/campaigns")
def create_campaign(
    req: CampaignCreate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    user, workspace = ctx

    # Check social account
    social_account = db.query(SocialAccount).filter(
        SocialAccount.id == req.social_account_id,
        SocialAccount.workspace_id == workspace.id
    ).first()
    if not social_account:
        raise HTTPException(status_code=404, detail="Akun platform terhubung tidak ditemukan.")

    start_dt = datetime.fromisoformat(req.start_date) if req.start_date else None
    end_dt = datetime.fromisoformat(req.end_date) if req.end_date else None

    campaign = KolCampaign(
        workspace_id=workspace.id,
        social_account_id=social_account.id,
        name=req.name.strip(),
        description=req.description,
        status=req.status,
        start_date=start_dt,
        end_date=end_dt,
        total_budget=req.total_budget,
        estimated_revenue=req.estimated_revenue,
        campaign_brief_url=req.campaign_brief_url,
        hashtag_mandatory=req.hashtag_mandatory,
        created_by_user_id=user.id
    )
    db.add(campaign)

    log = ActivityLog(
        workspace_id=workspace.id,
        user_name=user.full_name,
        action="CREATE_KOL_CAMPAIGN",
        details=f"Membuat campaign KOL '{campaign.name}' untuk akun @{social_account.username}",
        entity_type="KolCampaign",
        entity_id=campaign.id
    )
    db.add(log)
    db.commit()
    db.refresh(campaign)

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"Campaign '{campaign.name}' berhasil dibuat.", "id": campaign.id}


@router.get("/campaigns/{campaign_id}")
def get_campaign_detail(
    campaign_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    campaign = db.query(KolCampaign).filter(
        KolCampaign.id == campaign_id,
        KolCampaign.workspace_id == workspace.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")

    social_acc = campaign.social_account
    kols_list = []
    for ckol in campaign.campaign_kols:
        kol_prof = ckol.kol_profile
        deliverables_list = []
        for d in ckol.deliverables:
            deliverables_list.append({
                "id": d.id,
                "campaign_kol_id": d.campaign_kol_id,
                "deliverable_type": d.deliverable_type.value if hasattr(d.deliverable_type, "value") else str(d.deliverable_type),
                "title": d.title,
                "status": d.status.value if hasattr(d.status, "value") else str(d.status),
                "due_date": d.due_date.strftime("%Y-%m-%d") if d.due_date else None,
                "content_url": d.content_url,
                "review_notes": d.review_notes,
                "approved_at": d.approved_at.strftime("%Y-%m-%dT%H:%M:%SZ") if d.approved_at else None,
                "created_at": d.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if d.created_at else None
            })

        kols_list.append({
            "ckol_id": ckol.id,
            "kol_profile_id": ckol.kol_profile_id,
            "public_token": ckol.public_token or ckol.id,
            "agreed_rate": ckol.agreed_rate,
            "payment_status": ckol.payment_status.value if hasattr(ckol.payment_status, "value") else str(ckol.payment_status),
            "paid_amount": ckol.paid_amount,
            "notes": ckol.notes,
            "joined_at": ckol.joined_at.strftime("%Y-%m-%dT%H:%M:%SZ") if ckol.joined_at else None,
            "kol_profile": {
                "id": kol_prof.id,
                "name": kol_prof.name,
                "username": kol_prof.username,
                "primary_platform": kol_prof.primary_platform.value if hasattr(kol_prof.primary_platform, "value") else str(kol_prof.primary_platform),
                "tier": kol_prof.tier,
                "followers_count": kol_prof.followers_count,
                "engagement_rate": kol_prof.engagement_rate,
                "profile_pic_url": kol_prof.profile_pic_url,
                "contact_wa": kol_prof.contact_wa,
                "is_blacklisted": kol_prof.is_blacklisted
            } if kol_prof else None,
            "deliverables": deliverables_list
        })

    return {
        "id": campaign.id,
        "workspace_id": campaign.workspace_id,
        "social_account_id": campaign.social_account_id,
        "social_account": {
            "id": social_acc.id,
            "username": social_acc.username,
            "name": social_acc.name,
            "platform": social_acc.platform.value if hasattr(social_acc.platform, "value") else str(social_acc.platform),
            "avatar_url": social_acc.avatar_url
        } if social_acc else None,
        "name": campaign.name,
        "description": campaign.description,
        "status": campaign.status.value if hasattr(campaign.status, "value") else str(campaign.status),
        "start_date": campaign.start_date.strftime("%Y-%m-%d") if campaign.start_date else None,
        "end_date": campaign.end_date.strftime("%Y-%m-%d") if campaign.end_date else None,
        "total_budget": campaign.total_budget,
        "estimated_revenue": campaign.estimated_revenue,
        "campaign_brief_url": campaign.campaign_brief_url,
        "hashtag_mandatory": campaign.hashtag_mandatory,
        "kols": kols_list,
        "created_at": campaign.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if campaign.created_at else None
    }


@router.put("/campaigns/{campaign_id}")
def update_campaign(
    campaign_id: str,
    req: CampaignUpdate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    campaign = db.query(KolCampaign).filter(
        KolCampaign.id == campaign_id,
        KolCampaign.workspace_id == workspace.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")

    if req.name is not None:
        campaign.name = req.name.strip()
    if req.description is not None:
        campaign.description = req.description
    if req.status is not None:
        campaign.status = req.status
    if req.start_date is not None:
        campaign.start_date = datetime.fromisoformat(req.start_date) if req.start_date else None
    if req.end_date is not None:
        campaign.end_date = datetime.fromisoformat(req.end_date) if req.end_date else None
    if req.total_budget is not None:
        campaign.total_budget = req.total_budget
    if req.estimated_revenue is not None:
        campaign.estimated_revenue = req.estimated_revenue
    if req.campaign_brief_url is not None:
        campaign.campaign_brief_url = req.campaign_brief_url
    if req.hashtag_mandatory is not None:
        campaign.hashtag_mandatory = req.hashtag_mandatory

    campaign.updated_at = datetime.utcnow()
    db.commit()

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"Campaign '{campaign.name}' berhasil diperbarui."}


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(
    campaign_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    campaign = db.query(KolCampaign).filter(
        KolCampaign.id == campaign_id,
        KolCampaign.workspace_id == workspace.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")

    name = campaign.name
    db.delete(campaign)
    db.commit()

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"Campaign '{name}' berhasil dihapus."}


@router.get("/campaigns/{campaign_id}/roi")
def get_campaign_roi(
    campaign_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    Get detailed ROI and deliverable completion metrics for a campaign.
    """
    _, workspace = ctx
    campaign = db.query(KolCampaign).filter(
        KolCampaign.id == campaign_id,
        KolCampaign.workspace_id == workspace.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")

    total_agreed = 0.0
    total_paid = 0.0

    deliverables_breakdown = {
        "pending": 0,
        "submitted": 0,
        "approved": 0,
        "revision_requested": 0,
        "rejected": 0,
        "total": 0
    }

    for ckol in campaign.campaign_kols:
        total_agreed += ckol.agreed_rate or 0.0
        total_paid += ckol.paid_amount or 0.0
        for d in ckol.deliverables:
            deliverables_breakdown["total"] += 1
            st = d.status.value if hasattr(d.status, "value") else str(d.status)
            if st in deliverables_breakdown:
                deliverables_breakdown[st] += 1

    roi_percentage = 0.0
    if campaign.total_budget > 0 and campaign.estimated_revenue:
        roi_percentage = round(((campaign.estimated_revenue - campaign.total_budget) / campaign.total_budget) * 100, 1)

    completion_rate = 0.0
    if deliverables_breakdown["total"] > 0:
        completion_rate = round((deliverables_breakdown["approved"] / deliverables_breakdown["total"]) * 100, 1)

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "total_budget": campaign.total_budget,
        "total_agreed_rate": total_agreed,
        "total_paid_amount": total_paid,
        "unpaid_remaining": max(0.0, total_agreed - total_paid),
        "estimated_revenue": campaign.estimated_revenue or 0.0,
        "roi_percentage": roi_percentage,
        "completion_rate": completion_rate,
        "total_kols": len(campaign.campaign_kols),
        "deliverables_summary": deliverables_breakdown
    }


# ─── Endpoints: Manage Campaign KOLs ──────────────────────────────────────────

@router.post("/campaigns/{campaign_id}/kols")
def add_kol_to_campaign(
    campaign_id: str,
    req: CampaignKolAdd,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    campaign = db.query(KolCampaign).filter(
        KolCampaign.id == campaign_id,
        KolCampaign.workspace_id == workspace.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")

    kol_profile = db.query(KolProfile).filter(
        KolProfile.id == req.kol_profile_id,
        KolProfile.workspace_id == workspace.id
    ).first()
    if not kol_profile:
        raise HTTPException(status_code=404, detail="KOL Profile tidak ditemukan.")

    # Check duplicate
    existing = db.query(KolCampaignKol).filter(
        KolCampaignKol.campaign_id == campaign.id,
        KolCampaignKol.kol_profile_id == kol_profile.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"KOL @{kol_profile.username} sudah ada di campaign ini.")

    ckol = KolCampaignKol(
        campaign_id=campaign.id,
        kol_profile_id=kol_profile.id,
        agreed_rate=req.agreed_rate,
        payment_status=req.payment_status,
        paid_amount=req.paid_amount,
        notes=req.notes
    )
    db.add(ckol)
    db.commit()
    db.refresh(ckol)

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"KOL @{kol_profile.username} berhasil ditambahkan ke campaign.", "id": ckol.id}


@router.put("/campaigns/{campaign_id}/kols/{ckol_id}")
def update_campaign_kol(
    campaign_id: str,
    ckol_id: str,
    req: CampaignKolUpdate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    ckol = db.query(KolCampaignKol).filter(
        KolCampaignKol.id == ckol_id,
        KolCampaignKol.campaign_id == campaign_id
    ).first()
    if not ckol:
        raise HTTPException(status_code=404, detail="Data KOL di campaign tidak ditemukan.")

    if req.agreed_rate is not None:
        ckol.agreed_rate = req.agreed_rate
    if req.payment_status is not None:
        ckol.payment_status = req.payment_status
    if req.paid_amount is not None:
        ckol.paid_amount = req.paid_amount
    if req.notes is not None:
        ckol.notes = req.notes

    db.commit()
    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": "Data KOL campaign berhasil diperbarui."}


@router.delete("/campaigns/{campaign_id}/kols/{ckol_id}")
def remove_kol_from_campaign(
    campaign_id: str,
    ckol_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    ckol = db.query(KolCampaignKol).filter(
        KolCampaignKol.id == ckol_id,
        KolCampaignKol.campaign_id == campaign_id
    ).first()
    if not ckol:
        raise HTTPException(status_code=404, detail="Data KOL di campaign tidak ditemukan.")

    db.delete(ckol)
    db.commit()

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": "KOL berhasil dihapus dari campaign."}


# ─── Endpoints: Deliverables ──────────────────────────────────────────────────

@router.post("/deliverables")
def create_deliverable(
    req: DeliverableCreate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    ckol = db.query(KolCampaignKol).filter(
        KolCampaignKol.id == req.campaign_kol_id
    ).first()
    if not ckol:
        raise HTTPException(status_code=404, detail="Campaign KOL tidak ditemukan.")

    due_dt = datetime.fromisoformat(req.due_date) if req.due_date else None

    deliverable = KolDeliverable(
        campaign_kol_id=ckol.id,
        deliverable_type=req.deliverable_type,
        title=req.title.strip(),
        status=req.status,
        due_date=due_dt,
        content_url=req.content_url,
        review_notes=req.review_notes
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"Deliverable '{deliverable.title}' berhasil dibuat.", "id": deliverable.id}


@router.put("/deliverables/{id}")
def update_deliverable(
    id: str,
    req: DeliverableUpdate,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    deliverable = db.query(KolDeliverable).filter(KolDeliverable.id == id).first()
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable tidak ditemukan.")

    if req.deliverable_type is not None:
        deliverable.deliverable_type = req.deliverable_type
    if req.title is not None:
        deliverable.title = req.title.strip()
    if req.status is not None:
        deliverable.status = req.status
        if req.status == "approved":
            deliverable.approved_at = datetime.utcnow()
    if req.due_date is not None:
        deliverable.due_date = datetime.fromisoformat(req.due_date) if req.due_date else None
    if req.content_url is not None:
        deliverable.content_url = req.content_url
    if req.review_notes is not None:
        deliverable.review_notes = req.review_notes

    deliverable.updated_at = datetime.utcnow()
    db.commit()

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"Deliverable '{deliverable.title}' berhasil diperbarui."}


@router.delete("/deliverables/{id}")
def delete_deliverable(
    id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    _, workspace = ctx
    deliverable = db.query(KolDeliverable).filter(KolDeliverable.id == id).first()
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable tidak ditemukan.")

    title = deliverable.title
    db.delete(deliverable)
    db.commit()

    cache_delete_prefix(f"kol:campaigns:{workspace.id}")
    return {"status": "ok", "message": f"Deliverable '{title}' berhasil dihapus."}


# ─── Public Unauthenticated Portal Endpoints for Influencers ────────────────────

class PublicSubmitDeliverableRequest(BaseModel):
    deliverable_id: str
    content_url: str
    review_notes: Optional[str] = None


@router.get("/public-portal/{token}")
def get_public_kol_portal(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Public unauthenticated endpoint for influencer to view assigned campaign,
    deliverables checklist, brief, and submit their content URL.
    """
    ckol = db.query(KolCampaignKol).filter(KolCampaignKol.public_token == token).first()
    if not ckol:
        raise HTTPException(status_code=404, detail="Link portal KOL tidak valid atau sudah kadaluarsa.")

    campaign = ckol.campaign
    kol_prof = ckol.kol_profile
    workspace = campaign.workspace if campaign else None
    social_acc = campaign.social_account if campaign else None

    deliverables_list = []
    for d in ckol.deliverables or []:
        deliverables_list.append({
            "id": d.id,
            "deliverable_type": d.deliverable_type.value if hasattr(d.deliverable_type, "value") else str(d.deliverable_type),
            "title": d.title,
            "status": d.status.value if hasattr(d.status, "value") else str(d.status),
            "due_date": d.due_date.strftime("%Y-%m-%d") if d.due_date else None,
            "content_url": d.content_url,
            "review_notes": d.review_notes,
            "approved_at": d.approved_at.strftime("%Y-%m-%dT%H:%M:%SZ") if d.approved_at else None
        })

    return {
        "portal_token": ckol.public_token,
        "kol": {
            "name": kol_prof.name if kol_prof else "KOL Partner",
            "username": kol_prof.username if kol_prof else "",
            "primary_platform": kol_prof.primary_platform.value if hasattr(kol_prof.primary_platform, "value") else str(kol_prof.primary_platform) if kol_prof else "instagram"
        },
        "campaign": {
            "name": campaign.name if campaign else "Campaign",
            "description": campaign.description if campaign else None,
            "campaign_brief_url": campaign.campaign_brief_url if campaign else None,
            "hashtag_mandatory": campaign.hashtag_mandatory if campaign else None,
            "brand_account": f"@{social_acc.username} ({social_acc.platform.value if hasattr(social_acc.platform, 'value') else str(social_acc.platform)})" if social_acc else None,
            "agency_name": workspace.name if workspace else "Agency"
        },
        "deliverables": deliverables_list,
        "payment_info": {
            "agreed_rate": ckol.agreed_rate,
            "payment_status": ckol.payment_status.value if hasattr(ckol.payment_status, "value") else str(ckol.payment_status),
            "paid_amount": ckol.paid_amount
        }
    }


@router.post("/public-portal/{token}/submit-deliverable")
def submit_public_kol_deliverable(
    token: str,
    req: PublicSubmitDeliverableRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint allowing influencer to submit/paste their content URL.
    Automatically updates status to 'submitted'.
    """
    ckol = db.query(KolCampaignKol).filter(KolCampaignKol.public_token == token).first()
    if not ckol:
        raise HTTPException(status_code=404, detail="Link portal KOL tidak valid.")

    deliverable = db.query(KolDeliverable).filter(
        KolDeliverable.id == req.deliverable_id,
        KolDeliverable.campaign_kol_id == ckol.id
    ).first()

    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable tidak ditemukan pada portal Anda.")

    deliverable.content_url = req.content_url.strip()
    deliverable.status = KolDeliverableStatus.SUBMITTED
    if req.review_notes:
        deliverable.review_notes = req.review_notes.strip()
    deliverable.updated_at = datetime.utcnow()

    db.commit()

    if ckol.campaign:
        cache_delete_prefix(f"kol:campaigns:{ckol.campaign.workspace_id}")

    return {
        "status": "ok",
        "message": f"Link konten untuk '{deliverable.title}' berhasil dikirim! Status telah diperbarui ke Submitted.",
        "deliverable_id": deliverable.id,
        "content_url": deliverable.content_url
    }
