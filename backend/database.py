from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

# Adjust sqlite connection args if needed
connect_args = {}
if settings.POSTGRES_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Replace postgres:// with postgresql:// if passed from Supabase
db_url = settings.POSTGRES_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
