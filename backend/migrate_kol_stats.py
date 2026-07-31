from sqlalchemy import text
from backend.database import engine

STAT_COLS = [
    ("stat_views", "INTEGER"),
    ("stat_likes", "INTEGER"),
    ("stat_comments", "INTEGER"),
    ("stat_shares", "INTEGER"),
    ("stat_reach", "INTEGER"),
    ("stat_reported_at", "TIMESTAMP"),
    ("stat_period_days", "INTEGER"),
]

def column_exists(conn, table, col):
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = :t AND column_name = :c"
    ), {"t": table, "c": col})
    return result.fetchone() is not None

def migrate():
    print("Migrating kol_deliverables: adding statistics columns...")
    with engine.connect() as conn:
        for col_name, col_type in STAT_COLS:
            if column_exists(conn, "kol_deliverables", col_name):
                print(f"  [SKIP] {col_name} already exists")
            else:
                conn.execute(text(f"ALTER TABLE kol_deliverables ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"  [OK] Added column: {col_name}")
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
