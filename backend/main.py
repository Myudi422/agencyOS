from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from backend.config import settings
from backend.database import engine, Base
from backend.routers import (
    auth, workspaces, clients, accounts, media, posts, calendar, queue, activity, dashboard
)
from backend.seed import seed_database

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgencyOS-Main")

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0-MVP",
    description="Enterprise Multi-Workspace, Multi-Client Instagram Business & Facebook Page Management Platform."
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
def root():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0-MVP",
        "docs": "/docs",
        "mock_mode": settings.USE_MOCK_SERVICES
    }
