"""
Migration Script: Add social_account_id column to competitor_accounts table
"""

from sqlalchemy import text
from backend.database import engine

def run_migration():
    print("Running migration using SQLAlchemy engine...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='competitor_accounts' AND column_name='social_account_id';
            """)
            res = conn.execute(query).fetchone()
            if not res:
                print("Adding social_account_id column to competitor_accounts...")
                conn.execute(text("ALTER TABLE competitor_accounts ADD COLUMN social_account_id VARCHAR(36) REFERENCES social_accounts(id) ON DELETE CASCADE;"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_competitor_accounts_social_account_id ON competitor_accounts (social_account_id);"))
                conn.commit()
                print("Column social_account_id added successfully.")
            else:
                print("Column social_account_id already exists.")
        except Exception as e:
            print(f"Migration check/execution note: {e}")

if __name__ == "__main__":
    run_migration()

