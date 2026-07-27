import os
import sys
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base, SessionLocal
from backend.models.models import (
    Workspace, Client, SocialAccount, Post, PostTarget, 
    PublishJob, ActivityLog, Media,
    AccountPlatform, AccountStatus, PostType, PostStatus, JobStatus
)

def reset_and_seed_database():
    print("1. Dropping existing PostgreSQL tables & ENUM types with CASCADE...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()

    print("2. Re-creating clean database schema...")
    Base.metadata.create_all(bind=engine)

    print("2b. Seeding subscription plans...")
    from backend.seed_plans import seed_plans
    seed_plans()

    db = SessionLocal()


    print("3. Seeding Default Workspace & Client...")
    ws = Workspace(
        id="ws-default",
        name="Apex Global Agency HQ",
        slug="apex-agency",
        timezone="Asia/Jakarta"
    )
    db.add(ws)
    db.flush()

    client = Client(
        id="c1",
        workspace_id=ws.id,
        name="Luxe Fashion Co",
        description="Premium luxury apparel & lifestyle brand",
        brand_color="#9333ea",
        timezone="Asia/Jakarta"
    )
    db.add(client)
    db.flush()

    print("4. Starting fresh with 0 connected social accounts...")
    created_accounts = []

    print("5. Seeding Sample Posts, Targets & Queue Jobs...")
    post1 = Post(
        workspace_id=ws.id,
        client_id=client.id,
        post_type=PostType.IMAGE,
        caption="Summer 2026 Collection officially launched! ✨ Explore luxury craftsmanship across all channels.",
        hashtags="#LuxeFashion #Summer2026 #HighFashion #AgencyOS",
        media_urls=["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"],
        postforme_post_id="pst_pf_sample_001",
        status=PostStatus.PUBLISHED,
        published_at=datetime.utcnow()
    )
    db.add(post1)
    db.flush()

    for acc in created_accounts[:3]:
        pt = PostTarget(
            post_id=post1.id,
            social_account_id=acc.id,
            status=PostStatus.PUBLISHED,
            platform_post_id=f"pub_ext_{acc.platform}"
        )
        db.add(pt)

    post2 = Post(
        workspace_id=ws.id,
        client_id=client.id,
        post_type=PostType.VIDEO,
        caption="Behind the scenes at our Paris Runway showcase 🎥 #ParisFashionWeek",
        scheduled_at=datetime.utcnow() + timedelta(hours=3),
        status=PostStatus.SCHEDULED
    )
    db.add(post2)
    db.flush()

    for acc in created_accounts[3:6]:
        pt = PostTarget(
            post_id=post2.id,
            social_account_id=acc.id,
            status=PostStatus.SCHEDULED
        )
        db.add(pt)
        db.flush()

        job = PublishJob(
            post_target_id=pt.id,
            status=JobStatus.PENDING,
            attempts=0,
            max_attempts=5
        )
        db.add(job)

    print("5b. Seeding Sample Media Assets...")
    sample_media = [
        Media(
            workspace_id=ws.id,
            filename="summer_campaign_hero.jpg",
            file_type="image/jpeg",
            file_size=204800,
            url="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
            thumbnail_url="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
            b2_key="AgencyOS/General/summer_campaign_hero.jpg",
            folder="General",
            tags=["hero", "summer2026", "backblaze_b2"]
        ),
        Media(
            workspace_id=ws.id,
            filename="product_reels_showcase.mp4",
            file_type="video/mp4",
            file_size=5242880,
            url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
            b2_key="AgencyOS/Reels/product_reels_showcase.mp4",
            folder="Reels",
            tags=["reel", "showcase", "video"]
        ),
        Media(
            workspace_id=ws.id,
            filename="luxury_apparel_grid.jpg",
            file_type="image/jpeg",
            file_size=340000,
            url="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200",
            thumbnail_url="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400",
            b2_key="AgencyOS/Ads/luxury_apparel_grid.jpg",
            folder="Ads",
            tags=["grid", "luxury", "ads"]
        )
    ]
    for m in sample_media:
        db.add(m)
    db.flush()

    print("6. Seeding Activity Logs...")
    logs = [
        ActivityLog(
            workspace_id=ws.id,
            user_name="Alex Rivera",
            action="RESET_DATABASE",
            details="Database reset & clean schema re-aligned cleanly",
            entity_type="System"
        ),
        ActivityLog(
            workspace_id=ws.id,
            user_name="Alex Rivera",
            action="CONNECT_ACCOUNT",
            details="Connected 10 multi-platform social channels",
            entity_type="Account"
        ),
        ActivityLog(
            workspace_id=ws.id,
            user_name="Alex Rivera",
            action="PUBLISH_POST",
            details="Published Summer 2026 Collection post across Instagram, Facebook, & X",
            entity_type="Post"
        )
    ]
    for l in logs:
        db.add(l)

    db.commit()
    db.close()
    print("Database reset, multi-platform schema creation, and seeding complete!")

seed_database = reset_and_seed_database

if __name__ == "__main__":
    reset_and_seed_database()
