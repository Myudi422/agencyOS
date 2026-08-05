import sys
import types
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent

if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Dynamic alias for 'backend' package when executed in isolated Vercel container
if "backend" not in sys.modules:
    import importlib.machinery
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(backend_dir)]
    backend_pkg.__file__ = str(backend_dir / "__init__.py")
    backend_pkg.__spec__ = importlib.machinery.ModuleSpec("backend", None, is_package=True)
    sys.modules["backend"] = backend_pkg

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

try:
    from backend.config import settings
    from backend.database import engine, Base
    from backend.security import SecurityMiddleware
    from backend.routers import (
        auth, workspaces, clients, accounts, media, posts, calendar, queue, activity, dashboard,
        firebase_auth, billing, admin, webhook, statistics, competitors, kol, agents
    )
    from backend.routers.posts import v1_router as posts_v1_router
    from backend.seed import seed_database
except ModuleNotFoundError:
    from config import settings
    from database import engine, Base
    from security import SecurityMiddleware
    from routers import (
        auth, workspaces, clients, accounts, media, posts, calendar, queue, activity, dashboard,
        firebase_auth, billing, admin, webhook, statistics, competitors, kol, agents
    )
    from routers.posts import v1_router as posts_v1_router
    from seed import seed_database

# Import agent_scheduler separately — safe if apscheduler not installed
try:
    from backend.services import agent_scheduler
except (ImportError, ModuleNotFoundError):
    try:
        from services import agent_scheduler
    except (ImportError, ModuleNotFoundError):
        agent_scheduler = None  # type: ignore

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgencyOS-Main")

from sqlalchemy import text

# Create Database tables & apply self-healing schema migrations
try:
    # Import agent models so SQLAlchemy registers them before create_all
    from backend.models.agent_models import AgentConfig, AgentRunLog  # noqa: F401
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS watermark_config JSON DEFAULT '{}';"))
        conn.commit()
except Exception as e:
    logger.warning(f"Base.metadata.create_all or auto-migration skipped/warning: {e}")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    # Startup: launch AI Agent scheduler (no-op on serverless / if not installed)
    if agent_scheduler:
        try:
            agent_scheduler.start()
            logger.info("✅ AI Agent scheduler started.")
        except Exception as e:
            logger.error(f"Failed to start agent scheduler: {e}")
    yield
    # Shutdown
    if agent_scheduler:
        try:
            agent_scheduler.shutdown()
            logger.info("Agent scheduler stopped.")
        except Exception as e:
            logger.error(f"Failed to stop agent scheduler: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0-MVP",
    description="Enterprise Multi-Workspace, Multi-Client Instagram Business & Facebook Page Management Platform.",
    root_path="/api/backend",
    lifespan=lifespan,
)

def _build_allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOWED_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    if settings.FRONTEND_URL:
        origins.append(settings.FRONTEND_URL)
    origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://shiera.web.id",
    ])
    return list(dict.fromkeys(origins))

allowed_origins = _build_allowed_origins()

app.add_middleware(
    SecurityMiddleware,
    allowed_origins=allowed_origins,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(firebase_auth.router)
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(clients.router)
app.include_router(accounts.router)
app.include_router(media.router)
app.include_router(posts.router)
app.include_router(posts_v1_router)
app.include_router(calendar.router)
app.include_router(queue.router)
app.include_router(activity.router)
app.include_router(dashboard.router)
app.include_router(webhook.router)
app.include_router(statistics.router)
app.include_router(competitors.router)
app.include_router(kol.router)
app.include_router(agents.router)


@app.get("/")
@app.get("/api/backend")
@app.get("/api/backend/")
def root():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0-MVP",
        "docs": "/api/backend/docs",
        "mock_mode": settings.USE_MOCK_SERVICES
    }
