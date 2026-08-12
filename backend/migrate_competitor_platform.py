import sys
import os

# Add parent dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import engine
from sqlalchemy import text

def run_migration():
    print("Running migration: adding 'platform' column to competitor_accounts...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE competitor_accounts ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'instagram';"))
            conn.commit()
            print("Successfully added 'platform' column to competitor_accounts!")
        except Exception as e:
            print("Migration info/note:", e)

if __name__ == "__main__":
    run_migration()
