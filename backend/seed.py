from backend.database import SessionLocal, engine, Base
from backend.models.models import Workspace, Client

def seed_database():
    """Ensures database tables are created without adding any sample accounts or posts."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if not db.query(Workspace).first():
        print("Initializing primary empty workspace...")
        ws = Workspace(
            name="Main Agency Workspace",
            slug="main-agency",
            timezone="Asia/Jakarta"
        )
        db.add(ws)
        db.flush()

        client = Client(
            workspace_id=ws.id,
            name="Primary Client",
            description="Default workspace client",
            brand_color="#6366f1",
            timezone="Asia/Jakarta"
        )
        db.add(client)
        db.commit()

    db.close()
    print("Database tables & primary workspace ready (0 sample accounts).")

if __name__ == "__main__":
    seed_database()
