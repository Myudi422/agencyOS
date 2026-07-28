"""
Database Migration Script — Migrate database schema from Stripe to Midtrans.
Removes stripe columns and adds midtrans/IDR columns.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from backend.database import engine

def migrate():
    print("Migrating database schema for Midtrans...")
    with engine.begin() as conn:
        # subscription_plans table
        conn.execute(text("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_idr INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS stripe_price_id;"))
        
        # users table
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS midtrans_customer_id VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;"))
        
        # user_subscriptions table
        conn.execute(text("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS midtrans_order_id VARCHAR(255);"))
        conn.execute(text("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(255);"))
        conn.execute(text("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;"))
        conn.execute(text("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_invoice_id;"))
        
    print("[OK] Database schema migration complete!")

if __name__ == "__main__":
    migrate()
