"""
Midtrans Service — Snap Payment Gateway Integration (Sandbox / Production)
Provides helpers to create Snap transaction tokens and verify notification signatures.
"""
import hashlib
import logging
from typing import Dict, Any, Optional
import midtransclient
from backend.config import settings

logger = logging.getLogger("MidtransService")

def get_snap_client() -> midtransclient.Snap:
    """Returns an initialized Midtrans Snap client."""
    return midtransclient.Snap(
        is_production=settings.MIDTRANS_IS_PRODUCTION,
        server_key=settings.MIDTRANS_SERVER_KEY,
        client_key=settings.MIDTRANS_CLIENT_KEY,
    )

def get_core_api_client() -> midtransclient.CoreApi:
    """Returns an initialized Midtrans CoreApi client (for transaction status queries)."""
    return midtransclient.CoreApi(
        is_production=settings.MIDTRANS_IS_PRODUCTION,
        server_key=settings.MIDTRANS_SERVER_KEY,
        client_key=settings.MIDTRANS_CLIENT_KEY,
    )

def create_snap_transaction(
    order_id: str,
    gross_amount: int,
    item_name: str,
    customer_email: str,
    customer_name: Optional[str] = None,
    plan_tier: str = "creator",
    finish_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a Snap transaction with Midtrans.
    Returns dict containing 'token' and 'redirect_url'.
    """
    snap = get_snap_client()
    
    first_name = customer_name.split()[0] if customer_name else "User"
    last_name = " ".join(customer_name.split()[1:]) if customer_name and " " in customer_name else ""

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
        "credit_card": {
            "secure": True,
        },
        "customer_details": {
            "first_name": first_name,
            "last_name": last_name,
            "email": customer_email,
        },
        "item_details": [
            {
                "id": f"plan_{plan_tier}",
                "price": gross_amount,
                "quantity": 1,
                "name": item_name[:50],
            }
        ],
        "callbacks": {
            "finish": finish_url or f"{settings.FRONTEND_URL.rstrip('/')}/billing/success",
        },
        "custom_field1": customer_email,
        "custom_field2": plan_tier,
    }

    try:
        response = snap.create_transaction(param)
        logger.info(f"Midtrans Snap transaction created for {order_id} ({customer_email})")
        return {
            "token": response.get("token"),
            "redirect_url": response.get("redirect_url"),
            "order_id": order_id,
        }
    except Exception as e:
        logger.error(f"Failed to create Midtrans Snap transaction: {e}", exc_info=True)
        raise ValueError(f"Gagal membuat transaksi Midtrans: {str(e)}")

def verify_signature(order_id: str, status_code: str, gross_amount: str, signature_key: str) -> bool:
    """
    Verifies SHA512 signature key sent in Midtrans Notification callback.
    Format: SHA512(order_id + status_code + gross_amount + ServerKey)
    """
    raw_str = f"{order_id}{status_code}{gross_amount}{settings.MIDTRANS_SERVER_KEY}"
    calculated_sig = hashlib.sha512(raw_str.encode("utf-8")).hexdigest()
    return calculated_sig == signature_key

def get_transaction_status(order_id: str) -> Optional[Dict[str, Any]]:
    """
    Queries Midtrans Core API directly for order status.
    Useful for manual sync or auto-healing.
    """
    core = get_core_api_client()
    try:
        status_response = core.transactions.status(order_id)
        return status_response
    except Exception as e:
        logger.warning(f"Midtrans get status error for order {order_id}: {e}")
        return None
