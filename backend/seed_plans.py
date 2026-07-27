"""
Seed script — creates 4 subscription plans in DB.
All plans have UNLIMITED social accounts. Difference is only post quota.

Run: python backend/seed_plans.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import SessionLocal, engine, Base
from backend.models.models import SubscriptionPlan, PlanTier

Base.metadata.create_all(bind=engine)

PLANS = [
    {
        "tier": PlanTier.TRIAL,
        "name": "Starter Trial",
        "description": "Coba gratis 3 hari. Cukup tautkan kartu kredit Anda ($0).",
        "price_usd": 0.00,
        "duration_days": 3,
        "post_quota": 6,  # 2 posts/day × 3 days
        "features": [
            "✅ 6 posts total (2 post/hari)",
            "✅ Tautkan kartu kredit saja ($0)",
            "✅ Unlimited social accounts",
            "✅ Semua platform didukung",
            "⏱️ Berlaku 3 hari",
        ],
    },
    {
        "tier": PlanTier.CREATOR,
        "name": "Creator",
        "description": "Untuk content creator & freelancer yang butuh posting reguler.",
        "price_usd": 3.00,
        "duration_days": 30,
        "post_quota": 50,
        "features": [
            "✅ 50 posts/bulan",
            "✅ Unlimited social accounts",
            "✅ Semua platform didukung",
            "✅ Scheduling & media library",
            "🔄 Auto-renewal bulanan",
        ],
    },
    {
        "tier": PlanTier.AGENCY,
        "name": "Agency",
        "description": "Untuk agensi kecil yang mengelola klien & butuh posting tinggi.",
        "price_usd": 19.00,
        "duration_days": 30,
        "post_quota": 300,
        "features": [
            "✅ 300 posts/bulan",
            "✅ Unlimited social accounts",
            "✅ Multi-client management",
            "✅ Semua platform didukung",
            "✅ Scheduling & media library",
            "✅ Priority queue engine",
            "🔄 Auto-renewal bulanan",
        ],
    },
    {
        "tier": PlanTier.STUDIO,
        "name": "Studio",
        "description": "Untuk agensi besar dengan kebutuhan volume posting sangat tinggi.",
        "price_usd": 49.00,
        "duration_days": 30,
        "post_quota": 1000,
        "features": [
            "✅ 1.000 posts/bulan",
            "✅ Unlimited social accounts",
            "✅ Unlimited clients",
            "✅ Semua platform didukung",
            "✅ Full media library",
            "✅ API access & priority support",
            "🔄 Auto-renewal bulanan",
        ],
    },
]


def seed_plans():
    db = SessionLocal()
    try:
        created = 0
        updated = 0
        for plan_data in PLANS:
            existing = db.query(SubscriptionPlan).filter(
                SubscriptionPlan.tier == plan_data["tier"]
            ).first()

            if existing:
                # Update existing plan details
                existing.name = plan_data["name"]
                existing.description = plan_data["description"]
                existing.price_usd = plan_data["price_usd"]
                existing.duration_days = plan_data["duration_days"]
                existing.post_quota = plan_data["post_quota"]
                existing.features = plan_data["features"]
                # In case they were updated, reset the price ID so it regenerates on checkout demand
                existing.stripe_price_id = None
                updated += 1
                print(f"  [UPDATE] Updated plan: {plan_data['name']} (${plan_data['price_usd']})")
            else:
                plan = SubscriptionPlan(**plan_data)
                db.add(plan)
                created += 1
                print(f"  [OK] Created plan: {plan_data['name']} (${plan_data['price_usd']}, {plan_data['post_quota']} posts)")

        db.commit()
        print(f"\n[DONE] {created} plan(s) created, {updated} plan(s) updated.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()



if __name__ == "__main__":
    print("Seeding subscription plans...")
    seed_plans()
