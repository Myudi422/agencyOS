import uuid
from sqlalchemy import text
from backend.database import engine

def migrate():
    with engine.connect() as conn:
        print("Migrating kol_campaign_kols public_token column...")
        try:
            conn.execute(text("ALTER TABLE kol_campaign_kols ADD COLUMN public_token VARCHAR(64)"))
            conn.commit()
            print("Added public_token column successfully.")
        except Exception as e:
            print(f"Column might already exist: {e}")

        # Populate missing tokens
        result = conn.execute(text("SELECT id FROM kol_campaign_kols WHERE public_token IS NULL OR public_token = ''")).fetchall()
        for row in result:
            new_tok = str(uuid.uuid4())
            conn.execute(text("UPDATE kol_campaign_kols SET public_token = :tok WHERE id = :id"), {"tok": new_tok, "id": row.id})
        conn.commit()
        print(f"Updated {len(result)} missing public_tokens.")

if __name__ == "__main__":
    migrate()
