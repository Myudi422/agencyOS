import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

logger = logging.getLogger("Database")

# Adjust sqlite connection args if needed
connect_args = {}
if settings.POSTGRES_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Replace postgres:// with postgresql:// if passed from Supabase
db_url = settings.POSTGRES_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Fix for Supabase Pooler session mode limit (EMAXCONNSESSION max clients reached on 5432)
# Port 6543 on Supabase Pooler is Transaction Mode, designed for high-concurrency serverless execution.
if "pooler.supabase.com" in db_url and ":5432/" in db_url:
    logger.info("Detected Supabase Pooler on port 5432. Switching to port 6543 (Transaction Mode) to avoid EMAXCONNSESSION errors.")
    db_url = db_url.replace(":5432/", ":6543/", 1)

# Configure engine with serverless-friendly pooling settings
if "sqlite" in db_url:
    engine = create_engine(
        db_url,
        connect_args=connect_args
    )
else:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=300,
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
