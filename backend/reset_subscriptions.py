"""
Reset Subscriptions Script — Clears all user subscriptions in DB.
Run: python backend/reset_subscriptions.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import SessionLocal
from backend.models.models import UserSubscription, User

def reset_all_subscriptions():
    db = SessionLocal()
    try:
        count = db.query(UserSubscription).delete()
        db.commit()
        print(f"[OK] Successfully reset and deleted {count} user subscription record(s).")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Reset failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_all_subscriptions()
