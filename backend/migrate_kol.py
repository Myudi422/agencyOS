"""
Migration Script: Create KOL Campaign & Deliverable Tracker tables
"""

from backend.database import engine, Base
from backend.models import models  # Ensure all models are imported

def run_migration():
    print("Creating KOL tables via SQLAlchemy Base.metadata.create_all...")
    try:
        Base.metadata.create_all(bind=engine)
        print("KOL tables created or verified successfully!")
    except Exception as e:
        print(f"Error during KOL table creation: {e}")

if __name__ == "__main__":
    run_migration()
