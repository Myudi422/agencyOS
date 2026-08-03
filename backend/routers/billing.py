"""
Billing Router — /billing
Manages Midtrans Snap payment gateway integration, subscription plans, webhook processing,
and WhatsApp OTP verification for free trial claim.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import time
import uuid

from backend.database import get_db
from backend.models.models import (
    User, SubscriptionPlan, UserSubscription, SubscriptionStatus, PlanTier,
    WaOtpVerification
)
from backend.services import midtrans_service as ms
from backend.services import fonnte_service as fs
from backend.config import settings

logger = logging.getLogger("BillingRouter")
router = APIRouter(prefix="/billing", tags=["Billing"])

def get_frontend_url(request: Request) -> str:
    """
    Dynamically determines the frontend base URL based on incoming HTTP request headers
    (Origin, Referer, X-Forwarded-Host) or settings.FRONTEND_URL config fallback.
    This ensures Vercel deployments redirect to the Vercel domain instead of localhost.
    """
    origin = request.headers.get("origin")
    if origin and "localhost" not in origin:
        return origin.rstrip("/")

    referer = request.headers.get("referer")
    if referer:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc and "localhost" not in parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"

    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    if forwarded_host and "localhost" not in forwarded_host:
        proto = request.headers.get("x-forwarded-proto", "https")
        return f"{proto}://{forwarded_host}".rstrip("/")

    if settings.FRONTEND_URL and settings.FRONTEND_URL != "http://localhost:3000":
        return settings.FRONTEND_URL.rstrip("/")

    if origin:
        return origin.rstrip("/")

    return settings.FRONTEND_URL.rstrip("/")


class CheckoutRequest(BaseModel):
    plan_tier: str
    finish_url: Optional[str] = None


def _get_user_from_auth(authorization: Optional[str], db: Session) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    from backend.services.firebase_service import verify_firebase_token
    id_token = authorization.split(" ", 1)[1]
    firebase_user = verify_firebase_token(id_token)
    if not firebase_user:
        return None
    user = db.query(User).filter(User.firebase_uid == firebase_user["firebase_uid"]).first()
    return user


# ─── Public: List Plans ────────────────────────────────────────────────────────

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    """Returns all active subscription plans with Midtrans IDR pricing."""
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
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
            "features": p.features or [],
        }
        for p in plans_sorted
    ]


# ─── WhatsApp OTP Endpoints ────────────────────────────────────────────────────

OTP_RATE_LIMIT_SECONDS = 60   # Jeda minimum antar kirim OTP
OTP_EXPIRY_MINUTES = 5        # OTP berlaku 5 menit


class OtpSendRequest(BaseModel):
    phone: str  # nomor WA (format bebas: 08xx / +62xx / 62xx)


class OtpVerifyRequest(BaseModel):
    phone: str
    otp_code: str


@router.post("/otp/send")
async def send_wa_otp(
    req: OtpSendRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Kirim OTP ke nomor WhatsApp user untuk verifikasi sebelum claim trial.
    Rate limit: 1x per 60 detik per nomor.
    """
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    # Normalisasi nomor
    phone_normalized = fs.normalize_phone(req.phone)

    # Validasi panjang nomor WA Indonesia (62 + 8-12 digit)
    digits_after_62 = phone_normalized[2:]
    if not phone_normalized.startswith("62") or not digits_after_62.isdigit() or not (8 <= len(digits_after_62) <= 13):
        raise HTTPException(status_code=400, detail="Format nomor WhatsApp tidak valid. Contoh: 08123456789")

    # Cek apakah nomor WA sudah dipakai akun lain (yang sudah verified)
    existing_user_with_phone = (
        db.query(User)
        .filter(User.phone_number == phone_normalized, User.id != user.id, User.phone_verified == True)
        .first()
    )
    if existing_user_with_phone:
        raise HTTPException(
            status_code=409,
            detail="Nomor WhatsApp ini sudah terdaftar di akun lain. Gunakan nomor WA yang berbeda."
        )

    # Rate limit — cek OTP terakhir yang dikirim ke nomor ini untuk user ini
    now = datetime.utcnow()
    recent_otp = (
        db.query(WaOtpVerification)
        .filter(
            WaOtpVerification.user_id == user.id,
            WaOtpVerification.phone_number == phone_normalized,
        )
        .order_by(WaOtpVerification.last_sent_at.desc())
        .first()
    )

    if recent_otp:
        seconds_since_last = (now - recent_otp.last_sent_at).total_seconds()
        if seconds_since_last < OTP_RATE_LIMIT_SECONDS:
            wait = int(OTP_RATE_LIMIT_SECONDS - seconds_since_last)
            raise HTTPException(
                status_code=429,
                detail=f"Tunggu {wait} detik sebelum kirim OTP lagi."
            )

    # Generate OTP baru
    otp_code = fs.generate_otp(6)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Simpan ke DB (hapus OTP lama untuk user + nomor ini jika ada)
    db.query(WaOtpVerification).filter(
        WaOtpVerification.user_id == user.id,
        WaOtpVerification.phone_number == phone_normalized,
        WaOtpVerification.is_used == False,
    ).delete()

    otp_record = WaOtpVerification(
        id=str(uuid.uuid4()),
        user_id=user.id,
        phone_number=phone_normalized,
        otp_code=otp_code,
        is_used=False,
        is_verified=False,
        expires_at=expires_at,
        last_sent_at=now,
    )
    db.add(otp_record)
    db.commit()

    # Kirim OTP via Fonnte
    send_result = fs.send_otp_whatsapp(phone_normalized, otp_code)
    if not send_result["success"]:
        logger.error(f"Fonnte send failed for {phone_normalized}: {send_result['message']}")
        raise HTTPException(status_code=502, detail=send_result["message"])

    logger.info(f"OTP sent to {phone_normalized} for user {user.email}")
    return {
        "success": True,
        "message": f"OTP berhasil dikirim ke WhatsApp {req.phone}. Berlaku 5 menit.",
        "expires_in_seconds": OTP_EXPIRY_MINUTES * 60,
        "rate_limit_seconds": OTP_RATE_LIMIT_SECONDS,
    }


@router.post("/otp/verify")
async def verify_wa_otp(
    req: OtpVerifyRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Verifikasi OTP WhatsApp.
    Setelah sukses: user.phone_number & user.phone_verified disimpan ke DB.
    """
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    phone_normalized = fs.normalize_phone(req.phone)
    now = datetime.utcnow()

    # Cari OTP yang valid
    otp_record = (
        db.query(WaOtpVerification)
        .filter(
            WaOtpVerification.user_id == user.id,
            WaOtpVerification.phone_number == phone_normalized,
            WaOtpVerification.is_used == False,
            WaOtpVerification.expires_at > now,
        )
        .order_by(WaOtpVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="OTP tidak valid atau sudah kedaluwarsa. Minta OTP baru."
        )

    if otp_record.otp_code != req.otp_code.strip():
        raise HTTPException(status_code=400, detail="Kode OTP salah. Periksa kembali.")

    # Tandai OTP sebagai terpakai
    otp_record.is_used = True
    otp_record.is_verified = True

    # Update user: simpan nomor WA yang sudah terverifikasi
    user.phone_number = phone_normalized
    user.phone_verified = True

    db.commit()

    logger.info(f"WA OTP verified for user {user.email}, phone {phone_normalized}")
    return {
        "success": True,
        "message": "Nomor WhatsApp berhasil diverifikasi!",
        "phone": phone_normalized,
    }


# ─── Checkout ─────────────────────────────────────────────────────────────────

@router.post("/checkout")
async def create_checkout(
    req: CheckoutRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Creates a Midtrans Snap transaction token & redirect URL dynamically pointing to frontend origin."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == req.plan_tier).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{req.plan_tier}' not found.")

    frontend_url = get_frontend_url(request)

    # ── Free Trial handling ──────────────────────────────────────────────────
    if req.plan_tier == "trial":
        sub = user.subscription

        # Guard 1: Cek sudah pernah claim trial sebelumnya
        if sub is not None:
            raise HTTPException(
                status_code=403,
                detail="Kamu sudah pernah menggunakan free trial. Silakan pilih paket berbayar untuk melanjutkan."
            )

        # Guard 2: Wajib verifikasi WA dulu
        if not user.phone_verified:
            raise HTTPException(
                status_code=403,
                detail="Verifikasi nomor WhatsApp diperlukan sebelum claim free trial."
            )

        # Guard 3: Cek nomor WA tidak dipakai trial di akun lain
        # (phone_number sudah UNIQUE di DB, tapi kita tambah cek eksplisit)
        other_trial_user = (
            db.query(User)
            .filter(
                User.phone_number == user.phone_number,
                User.id != user.id,
                User.phone_verified == True,
            )
            .first()
        )
        if other_trial_user:
            # Cek apakah akun lain itu pernah trial
            other_sub = other_trial_user.subscription
            if other_sub is not None:
                raise HTTPException(
                    status_code=403,
                    detail="Nomor WhatsApp ini sudah digunakan untuk trial di akun lain."
                )

        # Aktifkan trial
        expires_at = datetime.utcnow() + timedelta(days=plan.duration_days)
        new_sub = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.TRIAL,
            posts_used=0,
            posts_limit=plan.post_quota,
            expires_at=expires_at,
        )
        db.add(new_sub)
        db.commit()

        redirect_url = req.finish_url or f"{frontend_url}/billing/success?plan=trial"
        return {
            "is_trial": True,
            "message": "Trial plan activated!",
            "redirect_url": redirect_url,
        }

    # ── Midtrans Paid Plan Checkout ──────────────────────────────────────────
    order_id = f"SHI-{user.id[:8]}-{plan.tier}-{int(time.time())}"
    finish_url = req.finish_url or f"{frontend_url}/billing/success?plan={req.plan_tier}&order_id={order_id}"

    try:
        snap_res = ms.create_snap_transaction(
            order_id=order_id,
            gross_amount=plan.price_idr,
            item_name=f"Shiera {plan.name} Plan ({plan.post_quota} Posts)",
            customer_email=user.email,
            customer_name=user.full_name,
            plan_tier=plan.tier.value if hasattr(plan.tier, "value") else str(plan.tier),
            finish_url=finish_url,
        )

        return {
            "snap_token": snap_res["token"],
            "snap_url": snap_res["redirect_url"],
            "order_id": order_id,
            "is_trial": False,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Midtrans checkout error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Midtrans error: {str(e)}")


class SyncCheckoutRequest(BaseModel):
    order_id: str


@router.post("/sync-checkout")
async def sync_checkout(
    req: SyncCheckoutRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Manual sync endpoint if notification callback is delayed or in local dev."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    status_data = ms.get_transaction_status(req.order_id)
    if not status_data:
        raise HTTPException(status_code=404, detail="Order ID tidak ditemukan di Midtrans.")

    transaction_status = status_data.get("transaction_status")
    fraud_status = status_data.get("fraud_status")

    is_paid = transaction_status in ("settlement", "capture")
    if transaction_status == "capture" and fraud_status == "challenge":
        is_paid = False

    if not is_paid:
        raise HTTPException(
            status_code=400,
            detail=f"Transaksi status Midtrans: '{transaction_status}'. Pembayaran belum selesai."
        )

    # Extract info from custom fields or order_id
    customer_email = user.email
    plan_tier = status_data.get("custom_field2")
    if not plan_tier and req.order_id and "SHI-" in req.order_id:
        parts = req.order_id.split("-")
        if len(parts) >= 3:
            plan_tier = parts[2]
    if not plan_tier:
        plan_tier = "creator"

    _activate_user_subscription(
        email=customer_email,
        plan_tier=plan_tier,
        order_id=req.order_id,
        transaction_id=status_data.get("transaction_id"),
        db=db
    )

    db.refresh(user)
    sub = user.subscription
    if not sub:
        raise HTTPException(status_code=500, detail="Gagal mengaktifkan langganan.")

    posts_remaining = max(0, sub.posts_limit - sub.posts_used)
    return {
        "status": "success",
        "plan_tier": sub.plan.tier,
        "plan_name": sub.plan.name,
        "posts_limit": sub.posts_limit,
        "posts_used": sub.posts_used,
        "posts_remaining": posts_remaining,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
    }


# ─── Subscription Status ───────────────────────────────────────────────────────

@router.get("/subscription")
def get_subscription(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Returns current user's subscription status."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    sub = user.subscription
    is_expired = sub.expires_at and sub.expires_at < datetime.utcnow() if sub else True
    is_active = sub and sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL) and not is_expired

    if not sub:
        return {"subscription": None, "has_active_subscription": False}

    plan = sub.plan
    posts_remaining = max(0, sub.posts_limit - sub.posts_used)

    return {
        "subscription": {
            "id": sub.id,
            "plan_tier": plan.tier,
            "plan_name": plan.name,
            "status": sub.status,
            "posts_used": sub.posts_used,
            "posts_limit": sub.posts_limit,
            "posts_remaining": posts_remaining,
            "usage_percent": round((sub.posts_used / sub.posts_limit) * 100, 1) if sub.posts_limit else 0,
            "started_at": sub.started_at.isoformat(),
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
            "is_expired": is_expired,
            "features": plan.features or [],
        },
        "has_active_subscription": not is_expired and sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL),
    }


# ─── Midtrans Webhook / Notification Callback ──────────────────────────────────

@router.post("/notification")
@router.post("/webhook")
async def midtrans_notification(request: Request, db: Session = Depends(get_db)):
    """
    Handles HTTP Notification callback from Midtrans.
    Set Payment Notification URL in Midtrans Dashboard to:
    https://your-domain.com/api/backend/billing/notification
    """
    try:
        payload = await request.json()
    except Exception as e:
        logger.warning(f"Midtrans notification invalid JSON: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    order_id = payload.get("order_id")
    status_code = payload.get("status_code")
    gross_amount = payload.get("gross_amount")
    signature_key = payload.get("signature_key")
    transaction_status = payload.get("transaction_status")
    fraud_status = payload.get("fraud_status")

    if not order_id or not signature_key:
        raise HTTPException(status_code=400, detail="Missing required parameters")

    # Verify signature
    if not ms.verify_signature(order_id, status_code, gross_amount, signature_key):
        logger.warning(f"Midtrans notification signature mismatch for order {order_id}")
        raise HTTPException(status_code=403, detail="Invalid signature key")

    logger.info(f"Received Midtrans notification for order {order_id}: status={transaction_status}")

    # Determine payment success
    is_paid = False
    if transaction_status == "capture":
        if fraud_status == "accept":
            is_paid = True
    elif transaction_status == "settlement":
        is_paid = True

    customer_email = payload.get("custom_field1")
    plan_tier = payload.get("custom_field2")
    transaction_id = payload.get("transaction_id")

    if is_paid and customer_email and plan_tier:
        _activate_user_subscription(
            email=customer_email,
            plan_tier=plan_tier,
            order_id=order_id,
            transaction_id=transaction_id,
            db=db
        )
    elif transaction_status in ("cancel", "deny", "expire"):
        logger.info(f"Order {order_id} status changed to {transaction_status}")

    return {"status": "ok"}


def _activate_user_subscription(
    email: str,
    plan_tier: str,
    order_id: str,
    transaction_id: Optional[str],
    db: Session
):
    """Helper to activate user subscription after Midtrans payment settlement."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning(f"Activation failed: user with email {email} not found.")
        return

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == plan_tier).first()
    if not plan:
        logger.warning(f"Activation failed: plan tier '{plan_tier}' not found.")
        return

    expires_at = datetime.utcnow() + timedelta(days=plan.duration_days)

    sub = user.subscription
    if sub:
        sub.plan_id = plan.id
        sub.status = SubscriptionStatus.ACTIVE
        sub.posts_used = 0  # reset quota
        sub.posts_limit = plan.post_quota
        sub.started_at = datetime.utcnow()
        sub.expires_at = expires_at
        sub.midtrans_order_id = order_id
        sub.midtrans_transaction_id = transaction_id
    else:
        sub = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            posts_used=0,
            posts_limit=plan.post_quota,
            started_at=datetime.utcnow(),
            expires_at=expires_at,
            midtrans_order_id=order_id,
            midtrans_transaction_id=transaction_id,
        )
        db.add(sub)

    db.commit()
    logger.info(f"✅ Midtrans Activated {plan_tier} plan for {email} (order {order_id}, expires {expires_at.date()})")
