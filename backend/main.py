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

try:
    from backend.config import settings
    from backend.database import engine, Base
    from backend.routers import (
        auth, workspaces, clients, accounts, media, posts, calendar, queue, activity, dashboard
    )
    from backend.seed import seed_database
except ModuleNotFoundError:
    from config import settings
    from database import engine, Base
    from routers import (
        auth, workspaces, clients, accounts, media, posts, calendar, queue, activity, dashboard
    )
    from seed import seed_database

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgencyOS-Main")

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0-MVP",
    description="Enterprise Multi-Workspace, Multi-Client Instagram Business & Facebook Page Management Platform.",
    root_path="/api/backend"
)

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/production flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(clients.router)
app.include_router(accounts.router)
app.include_router(media.router)
app.include_router(posts.router)
app.include_router(calendar.router)
app.include_router(queue.router)
app.include_router(activity.router)
app.include_router(dashboard.router)

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
