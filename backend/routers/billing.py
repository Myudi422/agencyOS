"""
Billing Router — /billing
Manages subscription plans, Stripe checkout, and webhook processing.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from backend.database import get_db
from backend.models.models import (
    User, SubscriptionPlan, UserSubscription, SubscriptionStatus, PlanTier, ActivityLog
)
from backend.services import stripe_service as ss
from backend.config import settings

logger = logging.getLogger("BillingRouter")
router = APIRouter(prefix="/billing", tags=["Billing"])

FRONTEND_URL = "http://localhost:3000"


class CheckoutRequest(BaseModel):
    plan_tier: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


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
    """Returns all active subscription plans."""
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return [
        {
            "id": p.id,
            "tier": p.tier,
            "name": p.name,
            "description": p.description,
            "price_usd": p.price_usd,
            "duration_days": p.duration_days,
            "post_quota": p.post_quota,
            "stripe_price_id": p.stripe_price_id,
            "features": p.features or [],
        }
        for p in plans
    ]


# ─── Checkout ─────────────────────────────────────────────────────────────────

@router.post("/checkout")
async def create_checkout(
    req: CheckoutRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Creates a Stripe Checkout Session. Returns checkout_url."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == req.plan_tier).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{req.plan_tier}' not found.")

    success_url = req.success_url or f"{FRONTEND_URL}/billing/success?plan={req.plan_tier}&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = req.cancel_url or f"{FRONTEND_URL}/pricing"

    try:
        result = ss.create_checkout_session(
            user_email=user.email,
            stripe_price_id=plan.stripe_price_id,
            plan_tier=req.plan_tier,
            success_url=success_url,
            cancel_url=cancel_url,
            stripe_customer_id=user.stripe_customer_id,
            plan_name=plan.name,
            price_usd=plan.price_usd,
        )

        # If a Stripe price ID was auto-generated, save it to DB
        new_price_id = result.get("stripe_price_id")
        if new_price_id and new_price_id != plan.stripe_price_id:
            plan.stripe_price_id = new_price_id
            db.commit()

        return {"checkout_url": result["checkout_url"], "session_id": result["session_id"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


class SyncCheckoutRequest(BaseModel):
    session_id: str


@router.post("/sync-checkout")
async def sync_checkout(
    req: SyncCheckoutRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Fallback endpoint: manual subscription sync if webhook is not received (e.g. in local dev)."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        session = stripe.checkout.Session.retrieve(req.session_id)
        session_data = session.to_dict()
    except Exception as e:
        logger.error(f"Failed to retrieve Stripe session: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to retrieve Stripe session: {str(e)}")

    # Check that session is completed
    is_completed = session_data.get("status") == "complete"
    is_paid = session_data.get("payment_status") == "paid" or session_data.get("mode") == "setup"

    if not is_completed or not is_paid:
        raise HTTPException(
            status_code=400, 
            detail="Stripe Checkout Session belum diselesaikan atau pembayaran belum lunas."
        )

    # Process activation using our webhook handler logic
    _handle_checkout_completed(session_data, db)
    
    # Reload user and sub
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


class PortalRequest(BaseModel):
    return_url: Optional[str] = None


@router.post("/portal")
async def create_billing_portal(
    req: PortalRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Creates a Stripe Billing Portal session for the current user."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    # Get or create Stripe customer ID
    stripe_customer_id = user.stripe_customer_id
    if not stripe_customer_id:
        try:
            stripe_customer_id = ss.get_or_create_customer(user.email, user.full_name)
            user.stripe_customer_id = stripe_customer_id
            db.commit()
        except Exception as e:
            logger.error(f"Failed to get/create customer: {e}")
            raise HTTPException(status_code=500, detail="Gagal menyambungkan dengan Stripe.")

    return_url = req.return_url or f"{FRONTEND_URL}/pricing"
    try:
        portal_url = ss.create_portal_session(stripe_customer_id, return_url)
        return {"portal_url": portal_url}
    except Exception as e:
        logger.error(f"Failed to create portal session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Gagal memuat portal tagihan Stripe: {str(e)}")



# ─── Subscription Status ───────────────────────────────────────────────────────

@router.get("/subscription")
def get_subscription(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Returns current user's subscription status, with auto-healing fallback if inactive."""
    user = _get_user_from_auth(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    sub = user.subscription
    is_expired = sub.expires_at and sub.expires_at < datetime.utcnow() if sub else True
    is_active = sub and sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL) and not is_expired

    # Auto-healing fallback: if no subscription or expired, check Stripe for recent paid sessions
    if not is_active and settings.STRIPE_SECRET_KEY:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            # Find Stripe customer
            customers = stripe.Customer.list(email=user.email, limit=1)
            if customers.data:
                cust_id = customers.data[0].id
                if not user.stripe_customer_id:
                    user.stripe_customer_id = cust_id
                    db.commit()

                # List recent checkout sessions
                sessions = stripe.checkout.Session.list(customer=cust_id, limit=5)
                for s in sessions.data:
                    s_data = s.to_dict()
                    s_completed = s_data.get("status") == "complete"
                    s_paid = s_data.get("payment_status") == "paid" or s_data.get("mode") == "setup"
                    if s_completed and s_paid:
                        logger.info(f"Auto-heal: Found completed checkout session {s.id} for {user.email}")
                        _handle_checkout_completed(s_data, db)
                        db.refresh(user)
                        sub = user.subscription
                        is_expired = sub.expires_at and sub.expires_at < datetime.utcnow() if sub else True
                        break
        except Exception as e:
            logger.warning(f"Auto-healing Stripe sync failed: {e}", exc_info=True)


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



# ─── Stripe Webhook ───────────────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handles Stripe webhook events.
    Set webhook URL in Stripe Dashboard to: https://yourdomain.com/api/backend/billing/webhook
    Events handled: checkout.session.completed, customer.subscription.deleted
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = ss.construct_webhook_event(payload, sig_header)
    except ValueError as e:
        logger.warning(f"Stripe webhook invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as e:
        logger.warning(f"Stripe webhook signature error: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data, db)

    elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
        _handle_subscription_update(data, db)

    return {"status": "received"}


def _handle_checkout_completed(session_data: dict, db: Session):
    """Activates subscription after successful Stripe payment or credit card binding setup."""
    customer_email = session_data.get("customer_email")
    plan_tier = session_data.get("metadata", {}).get("plan_tier")
    stripe_sub_id = session_data.get("subscription")
    stripe_customer_id = session_data.get("customer")
    stripe_invoice_id = session_data.get("invoice")

    # If email is missing (common in setup mode), retrieve it from metadata or Stripe API
    if not customer_email:
        customer_email = session_data.get("metadata", {}).get("customer_email")
    if not customer_email and stripe_customer_id:
        try:
            import stripe
            cust = stripe.Customer.retrieve(stripe_customer_id)
            customer_email = cust.email
        except Exception as e:
            logger.warning(f"Could not retrieve Stripe customer email: {e}")

    if not customer_email or not plan_tier:
        logger.warning(f"Webhook missing email ({customer_email}) or plan_tier ({plan_tier}) metadata")
        return

    user = db.query(User).filter(User.email == customer_email).first()
    if not user:
        logger.warning(f"Webhook: user not found for email {customer_email}")
        return

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == plan_tier).first()
    if not plan:
        logger.warning(f"Webhook: plan not found for tier {plan_tier}")
        return

    # Update customer ID
    if stripe_customer_id:
        user.stripe_customer_id = stripe_customer_id

    # Calculate expiry
    expires_at = datetime.utcnow() + timedelta(days=plan.duration_days)
    status = SubscriptionStatus.TRIAL if plan_tier == "trial" else SubscriptionStatus.ACTIVE

    sub = user.subscription
    if sub:
        sub.plan_id = plan.id
        sub.status = status
        sub.posts_used = 0  # reset quota on new period
        sub.posts_limit = plan.post_quota
        sub.started_at = datetime.utcnow()
        sub.expires_at = expires_at
        sub.stripe_subscription_id = stripe_sub_id
        sub.stripe_invoice_id = stripe_invoice_id
    else:
        sub = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            status=status,
            posts_used=0,
            posts_limit=plan.post_quota,
            expires_at=expires_at,
            stripe_subscription_id=stripe_sub_id,
            stripe_invoice_id=stripe_invoice_id,
        )
        db.add(sub)

    db.commit()
    logger.info(f"✅ Activated {plan_tier} plan ({status.value}) for {customer_email} (expires {expires_at.date()})")



def _handle_subscription_update(sub_data: dict, db: Session):
    """Handles subscription cancellation/expiry from Stripe."""
    stripe_sub_id = sub_data.get("id")
    status = sub_data.get("status")

    sub = db.query(UserSubscription).filter(
        UserSubscription.stripe_subscription_id == stripe_sub_id
    ).first()

    if not sub:
        return

    if status in ("canceled", "unpaid", "past_due"):
        sub.status = SubscriptionStatus.EXPIRED if status == "canceled" else SubscriptionStatus.PAST_DUE
        db.commit()
        logger.info(f"Subscription {stripe_sub_id} updated to status: {status}")
