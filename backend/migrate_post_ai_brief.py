"""
Migration Script: Add ai_brief column to posts table
"""

from sqlalchemy import text
from backend.database import engine

def run_migration():
    print("Running migration for posts.ai_brief column...")
    with engine.connect() as conn:
        try:
            dialect = conn.dialect.name
            print(f"Database dialect detected: {dialect}")
            
            if dialect == "postgresql":
                query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='posts' AND column_name='ai_brief';
                """)
                res = conn.execute(query).fetchone()
                if not res:
                    print("Adding ai_brief column to posts...")
                    conn.execute(text("ALTER TABLE posts ADD COLUMN ai_brief TEXT;"))
                    conn.commit()
                    print("Column ai_brief added successfully.")
                else:
                    print("Column ai_brief already exists.")
            else:
                try:
                    conn.execute(text("ALTER TABLE posts ADD COLUMN ai_brief TEXT;"))
                    conn.commit()
                    print("Column ai_brief added to SQLite database.")
                except Exception as e:
                    print(f"Column ai_brief note: {e}")
        except Exception as e:
            print(f"Migration error/note: {e}")

if __name__ == "__main__":
    run_migration()
