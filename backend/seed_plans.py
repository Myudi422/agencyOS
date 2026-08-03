"""
Seed script — creates 4 subscription plans in DB with Midtrans IDR pricing.
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
        "description": "Coba gratis 3 hari. Kuota 6 posting.",
        "price_usd": 0.00,
        "price_idr": 0,
        "duration_days": 3,
        "post_quota": 6,  # 2 posts/day × 3 days
        "features": [
            "✅ 2 posts/hari",
        ],
    },
    {
        "tier": PlanTier.CREATOR,
        "name": "Creator",
        "description": "Untuk content creator & freelancer yang butuh posting reguler.",
        "price_usd": 3.00,
        "price_idr": 49000,
        "duration_days": 30,
        "post_quota": 50,
        "features": [
            "✅ 50 posts/bulan",
            "✅ Unlimited akun sosmed",
            "✅ Semua platform didukung",
            "✅ QRIS, GoPay, VA, Kartu Kredit",
            "✅ Scheduling & media library",
        ],
    },
    {
        "tier": PlanTier.AGENCY,
        "name": "Agency",
        "description": "Untuk agensi kecil yang mengelola klien & butuh posting tinggi.",
        "price_usd": 19.00,
        "price_idr": 299000,
        "duration_days": 30,
        "post_quota": 300,
        "features": [
            "✅ 300 posts/bulan",
            "✅ Unlimited akun sosmed",
            "✅ Multi-client management",
            "✅ Semua platform didukung",
            "✅ Priority queue engine",
            "✅ QRIS, GoPay, VA, Kartu Kredit",
        ],
    },
    {
        "tier": PlanTier.STUDIO,
        "name": "Studio",
        "description": "Untuk agensi besar dengan kebutuhan volume posting sangat tinggi.",
        "price_usd": 49.00,
        "price_idr": 749000,
        "duration_days": 30,
        "post_quota": 1000,
        "features": [
            "✅ 1.000 posts/bulan",
            "✅ Unlimited akun sosmed",
            "✅ Unlimited clients",
            "✅ Semua platform didukung",
            "✅ Full media library",
            "✅ API access & priority support",
            "✅ QRIS, GoPay, VA, Kartu Kredit",
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
                existing.name = plan_data["name"]
                existing.description = plan_data["description"]
                existing.price_usd = plan_data["price_usd"]
                existing.price_idr = plan_data["price_idr"]
                existing.duration_days = plan_data["duration_days"]
                existing.post_quota = plan_data["post_quota"]
                existing.features = plan_data["features"]
                updated += 1
                print(f"  [UPDATE] Updated plan: {plan_data['name']} (Rp {plan_data['price_idr']:,})")
            else:
                plan = SubscriptionPlan(**plan_data)
                db.add(plan)
                created += 1
                print(f"  [OK] Created plan: {plan_data['name']} (Rp {plan_data['price_idr']:,}, {plan_data['post_quota']} posts)")

        db.commit()
        print(f"\n[DONE] {created} plan(s) created, {updated} plan(s) updated.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding Midtrans subscription plans...")
    seed_plans()
