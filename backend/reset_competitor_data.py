"""
Reset Competitor Data Script
Deletes all records from competitor_posts and competitor_accounts tables,
and clears all Redis competitor cache keys.
"""

from backend.database import SessionLocal, engine
from backend.models.models import CompetitorPost, CompetitorAccount
from backend.services.redis_service import cache_delete_prefix
from sqlalchemy import text

def reset_competitors():
    print("Clearing competitor database tables...")
    db = SessionLocal()
    try:
        # Count before
        posts_count = db.query(CompetitorPost).count()
        accounts_count = db.query(CompetitorAccount).count()
        print(f"Current DB state: {accounts_count} competitor accounts, {posts_count} competitor posts.")

        # Delete all competitor posts first, then competitor accounts
        db.query(CompetitorPost).delete()
        db.query(CompetitorAccount).delete()
        db.commit()

        print("[SUCCESS] Database cleared: All competitor accounts and scraped posts deleted successfully.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error clearing competitor database: {e}")
    finally:
        db.close()

    print("Clearing Redis competitor caches...")
    try:
        cache_delete_prefix("competitors:")
        cache_delete_prefix("sync:")
        cache_delete_prefix("sync_status:")
        cache_delete_prefix("sync_account:")
        cache_delete_prefix("add_job:")
        print("[SUCCESS] Redis cache cleared successfully.")
    except Exception as e:
        print(f"[NOTE] Redis cache clear note: {e}")

if __name__ == "__main__":
    reset_competitors()
