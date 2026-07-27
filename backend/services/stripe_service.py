"""
Stripe Billing Service (Sandbox/Test Mode)
Handles checkout sessions, webhook events, and subscription management.
"""
import logging
import stripe
from typing import Optional, Dict, Any
from backend.config import settings

logger = logging.getLogger("StripeService")

# Configure Stripe with secret key
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(
    user_email: str,
    stripe_price_id: Optional[str],
    plan_tier: str,
    success_url: str,
    cancel_url: str,
    stripe_customer_id: Optional[str] = None,
    plan_name: Optional[str] = None,
    price_usd: Optional[float] = None,
) -> Dict[str, Any]:
    """Creates a Stripe Checkout Session. For trial, sets up card binding without payment."""
    if not settings.STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY not configured. Add sk_test_... to .env.local")

    # If it is trial, use setup mode to link credit card without charging
    if plan_tier == "trial":
        customer_id = get_or_create_customer(user_email, user_email.split("@")[0])
        params: Dict[str, Any] = {
            "mode": "setup",
            "payment_method_types": ["card"],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "customer": customer_id,
            "metadata": {"plan_tier": plan_tier, "customer_email": user_email},
        }
    else:
        # For paid tiers, auto-create Stripe Price ID if missing
        if not stripe_price_id:
            if plan_name and price_usd is not None:
                amount_cents = int(price_usd * 100)
                stripe_price_id = create_stripe_price(
                    plan_name=plan_name,
                    amount_cents=amount_cents,
                    interval="month",
                    is_one_time=False,
                )
            else:
                raise ValueError("Stripe Price ID is missing and cannot be auto-generated.")

        params: Dict[str, Any] = {
            "mode": "subscription",
            "line_items": [{"price": stripe_price_id, "quantity": 1}],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {"plan_tier": plan_tier},
            "allow_promotion_codes": True,
        }
        if stripe_customer_id:
            params["customer"] = stripe_customer_id
        else:
            params["customer_email"] = user_email

    session = stripe.checkout.Session.create(**params)
    return {
        "checkout_url": session.url,
        "session_id": session.id,
        "stripe_price_id": stripe_price_id if plan_tier != "trial" else None,
    }



def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    """Verifies and constructs a Stripe webhook event."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise ValueError("STRIPE_WEBHOOK_SECRET not configured.")
    return stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)


def create_stripe_price(
    plan_name: str,
    amount_cents: int,
    interval: Optional[str] = "month",
    is_one_time: bool = False,
) -> str:
    """Creates a Stripe Product + Price and returns the price ID."""
    if not settings.STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY not configured.")

    product = stripe.Product.create(name=f"AgencyOS {plan_name}")

    if is_one_time:
        price = stripe.Price.create(
            product=product.id,
            unit_amount=amount_cents,
            currency="usd",
        )
    else:
        price = stripe.Price.create(
            product=product.id,
            unit_amount=amount_cents,
            currency="usd",
            recurring={"interval": interval},
        )

    return price.id


def get_or_create_customer(email: str, name: str) -> str:
    """Gets existing Stripe customer by email or creates a new one."""
    existing = stripe.Customer.search(query=f'email:"{email}"', limit=1)
    if existing.data:
        return existing.data[0].id
    customer = stripe.Customer.create(email=email, name=name)
    return customer.id


def cancel_subscription(stripe_subscription_id: str) -> bool:
    """Cancels a Stripe subscription at period end."""
    try:
        stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True
        )
        return True
    except Exception as e:
        logger.error(f"Cancel subscription error: {e}")
        return False


def create_portal_session(stripe_customer_id: str, return_url: str) -> str:
    """Creates a Stripe Billing Portal session for the customer."""
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=return_url,
    )
    return session.url

