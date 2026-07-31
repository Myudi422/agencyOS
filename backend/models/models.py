import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Enum, JSON, Float
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PlanTier(str, enum.Enum):
    TRIAL = "trial"
    CREATOR = "creator"
    AGENCY = "agency"
    STUDIO = "studio"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    TRIAL = "trial"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"

class RoleEnum(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"

class AccountPlatform(str, enum.Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    X = "x"
    TIKTOK = "tiktok"
    TIKTOK_BUSINESS = "tiktok_business"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"
    LINKEDIN = "linkedin"
    BLUESKY = "bluesky"
    THREADS = "threads"
    # Legacy fallbacks
    INSTAGRAM_BUSINESS = "instagram_business"
    FACEBOOK_PAGE = "facebook_page"

class AccountStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    EXPIRED = "expired"
    NEED_RECONNECT = "need_reconnect"

class PostType(str, enum.Enum):
    IMAGE = "image"
    CAROUSEL = "carousel"
    VIDEO = "video"

class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(Text, nullable=True)
    firebase_uid = Column(String(255), unique=True, nullable=True, index=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    meta_user_id = Column(String(255), nullable=True)
    midtrans_customer_id = Column(String(255), nullable=True)
    # WhatsApp OTP Verification
    phone_number = Column(String(20), unique=True, nullable=True, index=True)  # format: 628xxx
    phone_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("UserSubscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    otp_verifications = relationship("WaOtpVerification", back_populates="user", cascade="all, delete-orphan")

class WaOtpVerification(Base):
    """Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial."""
    __tablename__ = "wa_otp_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String(20), nullable=False, index=True)  # format: 628xxx
    otp_code = Column(String(6), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)       # OTP sudah dipakai
    is_verified = Column(Boolean, default=False, nullable=False)   # OTP sukses diverifikasi
    expires_at = Column(DateTime, nullable=False)                  # OTP berlaku 5 menit
    last_sent_at = Column(DateTime, nullable=False, default=datetime.utcnow)  # untuk rate limit
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="otp_verifications")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    timezone = Column(String(100), default="UTC")
    logo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="workspace", cascade="all, delete-orphan")
    social_accounts = relationship("SocialAccount", back_populates="workspace", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="workspace", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="workspace", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="workspace", cascade="all, delete-orphan")
    competitor_accounts = relationship("CompetitorAccount", back_populates="workspace", cascade="all, delete-orphan")
    kol_profiles = relationship("KolProfile", back_populates="workspace", cascade="all, delete-orphan")
    kol_campaigns = relationship("KolCampaign", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.MEMBER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Client(Base):
    __tablename__ = "clients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    timezone = Column(String(100), default="UTC")
    brand_color = Column(String(50), default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="clients")
    social_accounts = relationship("SocialAccount", back_populates="client", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="client", cascade="all, delete-orphan")

class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    platform = Column(Enum(AccountPlatform), nullable=False)
    platform_account_id = Column(String(255), nullable=False) # IG User ID, FB Page ID, etc.
    postforme_account_id = Column(String(255), nullable=True) # PostForMe spc_xxxx ID
    name = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False, index=True)
    avatar_url = Column(Text, nullable=True)
    access_token_encrypted = Column(Text, nullable=False, default="postforme_managed")
    token_expires_at = Column(DateTime, nullable=True)
    status = Column(Enum(AccountStatus), default=AccountStatus.CONNECTED, nullable=False)
    is_favorite = Column(Boolean, default=False)
    account_group = Column(String(100), nullable=True)
    followers_count = Column(Integer, default=0)
    last_synced_at = Column(DateTime, default=datetime.utcnow)
    connected_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="social_accounts")
    client = relationship("Client", back_populates="social_accounts")
    post_targets = relationship("PostTarget", back_populates="social_account", cascade="all, delete-orphan")
    competitor_accounts = relationship("CompetitorAccount", back_populates="social_account", cascade="all, delete-orphan")
    kol_campaigns = relationship("KolCampaign", back_populates="social_account", cascade="all, delete-orphan")

class Media(Base):
    __tablename__ = "media"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # image/jpeg, video/mp4
    file_size = Column(Integer, nullable=False) # bytes
    url = Column(Text, nullable=False) # Storage / CDN URL
    thumbnail_url = Column(Text, nullable=True)
    b2_key = Column(String(255), nullable=False)
    folder = Column(String(255), default="General")
    tags = Column(JSON, default=list) # ["campaign", "promo"]
    is_favorite = Column(Boolean, default=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True) # in seconds for video
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="media")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True)
    post_type = Column(Enum(PostType), default=PostType.IMAGE, nullable=False)
    caption = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True)
    first_comment = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    alt_text = Column(Text, nullable=True)
    media_urls = Column(JSON, default=list) # List of image/video URLs
    platform_configurations = Column(JSON, nullable=True) # PostForMe platform configs (pinterest, tiktok, etc)
    postforme_post_id = Column(String(255), nullable=True) # PostForMe post ID
    scheduled_at = Column(DateTime, nullable=True, index=True)
    published_at = Column(DateTime, nullable=True)
    status = Column(Enum(PostStatus), default=PostStatus.DRAFT, nullable=False, index=True)
    created_by = Column(String(255), nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="posts")
    client = relationship("Client", back_populates="posts")
    targets = relationship("PostTarget", back_populates="post", cascade="all, delete-orphan")

class PostTarget(Base):
    __tablename__ = "post_targets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    social_account_id = Column(String(36), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(PostStatus), default=PostStatus.SCHEDULED, nullable=False)
    platform_post_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="targets")
    social_account = relationship("SocialAccount", back_populates="post_targets")
    jobs = relationship("PublishJob", back_populates="post_target", cascade="all, delete-orphan")
    publish_results = relationship("PostPublishResult", back_populates="post_target", cascade="all, delete-orphan")

class PublishJob(Base):
    __tablename__ = "publish_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_target_id = Column(String(36), ForeignKey("post_targets.id", ondelete="CASCADE"), nullable=False)
    redis_job_id = Column(String(255), nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    last_error = Column(Text, nullable=True)
    next_retry_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    post_target = relationship("PostTarget", back_populates="jobs")


class PostPublishResult(Base):
    """
    Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).
    Sumber kebenaran untuk status sukses/gagal dan URL post di platform.
    """
    __tablename__ = "post_publish_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_target_id = Column(String(36), ForeignKey("post_targets.id", ondelete="CASCADE"), nullable=False)
    postforme_result_id = Column(String(255), nullable=True, index=True)  # ID dari /v1/social-post-results
    postforme_post_id = Column(String(255), nullable=True, index=True)    # ID dari /v1/social-posts
    social_account_id = Column(String(255), nullable=True)                # PostForMe social_account_id
    success = Column(Boolean, nullable=True)
    platform_url = Column(Text, nullable=True)       # URL post yang dipublish di platform
    platform_post_id = Column(String(255), nullable=True)  # ID post di platform (IG, FB, dll)
    error_data = Column(JSON, nullable=True)          # Error detail jika gagal
    raw_result = Column(JSON, nullable=True)          # Full response dari PostForMe
    credit_deducted = Column(Boolean, default=False, nullable=False)  # Flag apakah kredit sudah dikurangi
    source = Column(String(50), default="sync", nullable=False)  # 'webhook' atau 'sync'
    created_at = Column(DateTime, default=datetime.utcnow)

    post_target = relationship("PostTarget", back_populates="publish_results")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(255), default="System")
    action = Column(String(100), nullable=False) # e.g. "CONNECT_ACCOUNT", "PUBLISH_POST"
    details = Column(Text, nullable=True)
    entity_type = Column(String(50), nullable=True) # Account, Post, Client, Media
    entity_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="activity_logs")

class Setting(Base):
    __tablename__ = "settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), nullable=False, index=True)
    key = Column(String(100), nullable=False)
    value = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubscriptionPlan(Base):
    """Paket langganan — semua plan unlimited akun sosmed, beda di quota post."""
    __tablename__ = "subscription_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tier = Column(Enum(PlanTier), unique=True, nullable=False)
    name = Column(String(100), nullable=False)  # e.g. "Starter Trial"
    description = Column(Text, nullable=True)
    price_usd = Column(Float, default=0.0, nullable=False)   # e.g. 3.00
    price_idr = Column(Integer, default=0, nullable=False)   # e.g. 49000
    duration_days = Column(Integer, nullable=False)  # 3 for trial, 30 for monthly
    post_quota = Column(Integer, nullable=False)     # max posts allowed per period
    # All plans: UNLIMITED social accounts (no account_limit field)
    is_active = Column(Boolean, default=True)
    features = Column(JSON, default=list)  # list of feature strings for UI display
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("UserSubscription", back_populates="plan")


class UserSubscription(Base):
    """Subscription aktif milik satu user."""
    __tablename__ = "user_subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan_id = Column(String(36), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL, nullable=False)
    posts_used = Column(Integer, default=0, nullable=False)  # posts sent this period
    posts_limit = Column(Integer, nullable=False)             # copied from plan at subscribe time
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)              # None = never (admin override)
    midtrans_order_id = Column(String(255), nullable=True)
    midtrans_transaction_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")


class CompetitorAccount(Base):
    __tablename__ = "competitor_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    social_account_id = Column(String(36), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=True, index=True)
    username = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    instagram_pk = Column(String(255), nullable=True)
    profile_pic_url = Column(Text, nullable=True)
    biography = Column(Text, nullable=True)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    media_count = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    category_name = Column(String(255), nullable=True)
    avg_likes = Column(Float, default=0.0)
    avg_comments = Column(Float, default=0.0)
    engagement_rate = Column(Float, default=0.0)
    top_hashtags = Column(JSON, default=list)
    last_synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="competitor_accounts")
    social_account = relationship("SocialAccount", back_populates="competitor_accounts")
    posts = relationship("CompetitorPost", back_populates="competitor", cascade="all, delete-orphan")


class CompetitorPost(Base):
    __tablename__ = "competitor_posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    competitor_id = Column(String(36), ForeignKey("competitor_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    instagram_media_id = Column(String(255), nullable=False, index=True)
    code = Column(String(255), nullable=True)  # Shortcode (e.g. C_x123)
    post_type = Column(String(50), default="image") # image, video, carousel
    caption = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    media_urls = Column(JSON, default=list)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    is_top_performer = Column(Boolean, default=False)
    posted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    competitor = relationship("CompetitorAccount", back_populates="posts")


class KolCampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class KolDeliverableType(str, enum.Enum):
    IG_POST = "ig_post"
    IG_REELS = "ig_reels"
    IG_STORY = "ig_story"
    TIKTOK_VIDEO = "tiktok_video"
    YOUTUBE_VIDEO = "youtube_video"
    YOUTUBE_SHORT = "youtube_short"
    TWITTER_POST = "twitter_post"
    LINKEDIN_POST = "linkedin_post"
    BLOG_POST = "blog_post"

class KolDeliverableStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"

class KolPaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


class KolProfile(Base):
    __tablename__ = "kol_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False, index=True)
    primary_platform = Column(Enum(AccountPlatform), default=AccountPlatform.INSTAGRAM, nullable=False)
    niche = Column(String(100), nullable=True)
    tier = Column(String(50), default="micro") # nano, micro, macro, mega
    followers_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    avg_views = Column(Integer, nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_wa = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    rate_card = Column(JSON, default=dict)
    profile_pic_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="kol_profiles")
    campaign_kols = relationship("KolCampaignKol", back_populates="kol_profile", cascade="all, delete-orphan")


class KolCampaign(Base):
    __tablename__ = "kol_campaigns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    social_account_id = Column(String(36), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(KolCampaignStatus), default=KolCampaignStatus.DRAFT, nullable=False, index=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    total_budget = Column(Float, default=0.0)
    estimated_revenue = Column(Float, nullable=True)
    campaign_brief_url = Column(Text, nullable=True)
    hashtag_mandatory = Column(String(255), nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="kol_campaigns")
    social_account = relationship("SocialAccount", back_populates="kol_campaigns")
    campaign_kols = relationship("KolCampaignKol", back_populates="campaign", cascade="all, delete-orphan")


class KolCampaignKol(Base):
    __tablename__ = "kol_campaign_kols"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("kol_campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    kol_profile_id = Column(String(36), ForeignKey("kol_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    public_token = Column(String(64), unique=True, index=True, default=generate_uuid)
    agreed_rate = Column(Float, default=0.0)
    payment_status = Column(Enum(KolPaymentStatus), default=KolPaymentStatus.UNPAID, nullable=False)
    paid_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("KolCampaign", back_populates="campaign_kols")
    kol_profile = relationship("KolProfile", back_populates="campaign_kols")
    deliverables = relationship("KolDeliverable", back_populates="campaign_kol", cascade="all, delete-orphan")


class KolDeliverable(Base):
    __tablename__ = "kol_deliverables"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_kol_id = Column(String(36), ForeignKey("kol_campaign_kols.id", ondelete="CASCADE"), nullable=False, index=True)
    deliverable_type = Column(Enum(KolDeliverableType), default=KolDeliverableType.IG_REELS, nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(Enum(KolDeliverableStatus), default=KolDeliverableStatus.PENDING, nullable=False, index=True)
    due_date = Column(DateTime, nullable=True)
    content_url = Column(Text, nullable=True)
    review_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campaign_kol = relationship("KolCampaignKol", back_populates="deliverables")

