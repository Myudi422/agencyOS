"""
Migration Script: Add briefing column to social_accounts table
"""

from sqlalchemy import text
from backend.database import engine

def run_migration():
    print("Running migration for social_accounts.briefing column...")
    with engine.connect() as conn:
        try:
            # Check db dialect (PostgreSQL vs SQLite)
            dialect = conn.dialect.name
            print(f"Database dialect detected: {dialect}")
            
            if dialect == "postgresql":
                query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='social_accounts' AND column_name='briefing';
                """)
                res = conn.execute(query).fetchone()
                if not res:
                    print("Adding briefing column (JSON) to social_accounts...")
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN briefing JSON;"))
                    conn.commit()
                    print("Column briefing added successfully.")
                else:
                    print("Column briefing already exists.")
            else:
                # SQLite fallback
                try:
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN briefing JSON;"))
                    conn.commit()
                    print("Column briefing added to SQLite database.")
                except Exception as e:
                    print(f"Column briefing might already exist or SQLite note: {e}")
        except Exception as e:
            print(f"Migration error/note: {e}")

if __name__ == "__main__":
    run_migration()
