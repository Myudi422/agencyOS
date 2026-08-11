"""
Agents Router — CRUD + Schedule + Run Now
REST API for managing AI Agent configurations.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.models import User
from backend.models.agent_models import AgentConfig, AgentRunLog, AgentRunStatus
from backend.routers.firebase_auth import require_user, get_user_workspace

try:
    from backend.services import agent_scheduler
except ImportError:
    try:
        from services import agent_scheduler
    except ImportError:
        agent_scheduler = None  # type: ignore


logger = logging.getLogger("AgentsRouter")

router = APIRouter(prefix="/agents", tags=["Agents"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AgentCreateRequest(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    account_ids: List[str] = Field(default_factory=list)
    content_pillar: str
    content_format: str
    topic_hint: Optional[str] = None
    drafts_per_run: int = Field(default=1, ge=1, le=5)
    run_time: str = "08:00"      # HH:MM
    timezone: str = "Asia/Jakarta"
    run_days: List[int] = Field(default=[0, 1, 2, 3, 4])  # 0=Mon..6=Sun
    is_active: bool = True


class AgentUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    account_ids: Optional[List[str]] = None
    content_pillar: Optional[str] = None
    content_format: Optional[str] = None
    topic_hint: Optional[str] = None
    drafts_per_run: Optional[int] = Field(default=None, ge=1, le=5)
    run_time: Optional[str] = None
    timezone: Optional[str] = None
    run_days: Optional[List[int]] = None
    is_active: Optional[bool] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_agent(agent: AgentConfig, db: Session) -> dict:
    last_log = (
        db.query(AgentRunLog)
        .filter(AgentRunLog.agent_id == agent.id)
        .order_by(AgentRunLog.started_at.desc())
        .first()
    )
    next_run = agent_scheduler.get_next_run(agent.id) if agent_scheduler else None

    return {
        "id": agent.id,
        "workspace_id": agent.workspace_id,
        "name": agent.name,
        "description": agent.description,
        "account_ids": agent.account_ids or [],
        "content_pillar": agent.content_pillar,
        "content_format": agent.content_format,
        "topic_hint": agent.topic_hint,
        "drafts_per_run": getattr(agent, "drafts_per_run", 1) or 1,
        "run_time": agent.run_time,
        "timezone": agent.timezone,
        "run_days": agent.run_days or [0, 1, 2, 3, 4],
        "is_active": agent.is_active,
        "last_run_at": agent.last_run_at.isoformat() if agent.last_run_at else None,
        "next_run_at": next_run.isoformat() if next_run else None,
        "total_runs": agent.total_runs or 0,
        "total_drafts_generated": agent.total_drafts_generated or 0,
        "last_run_status": last_log.status.value if last_log else None,
        "created_at": agent.created_at.isoformat() if agent.created_at else None,
        "updated_at": agent.updated_at.isoformat() if agent.updated_at else None,
    }


def _serialize_log(log: AgentRunLog) -> dict:
    return {
        "id": log.id,
        "agent_id": log.agent_id,
        "status": log.status.value,
        "trigger": log.trigger,
        "accounts_targeted": log.accounts_targeted or [],
        "content_pillar": log.content_pillar,
        "content_format": log.content_format,
        "topic_hint": log.topic_hint,
        "drafts": log.drafts or [],
        "drafts_count": log.drafts_count or 0,
        "error_message": log.error_message,
        "started_at": log.started_at.isoformat() if log.started_at else None,
        "completed_at": log.completed_at.isoformat() if log.completed_at else None,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/")
def list_agents(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """List all agents for a workspace."""
    get_user_workspace(current_user, workspace_id, db)
    agents = (
        db.query(AgentConfig)
        .filter(AgentConfig.workspace_id == workspace_id)
        .order_by(AgentConfig.created_at.desc())
        .all()
    )
    return [_serialize_agent(a, db) for a in agents]


@router.post("/")
def create_agent(
    req: AgentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Create a new agent configuration."""
    get_user_workspace(current_user, req.workspace_id, db)

    # Validate run_time format HH:MM
    try:
        h, m = map(int, req.run_time.split(":"))
        assert 0 <= h < 24 and 0 <= m < 60
    except Exception:
        raise HTTPException(status_code=400, detail="Format run_time harus HH:MM (contoh: 08:00)")

    agent = AgentConfig(
        workspace_id=req.workspace_id,
        created_by_user_id=current_user.id,
        name=req.name,
        description=req.description,
        account_ids=req.account_ids,
        content_pillar=req.content_pillar,
        content_format=req.content_format,
        topic_hint=req.topic_hint,
        drafts_per_run=req.drafts_per_run,
        run_time=req.run_time,
        timezone=req.timezone,
        run_days=req.run_days,
        is_active=req.is_active,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    # Schedule if active
    if agent.is_active and agent_scheduler:
        agent_scheduler.add_agent(agent.id, agent.run_time, agent.timezone, agent.run_days)

    logger.info(f"✅ Agent '{agent.name}' created (id={agent.id})")
    return _serialize_agent(agent, db)


@router.get("/cron-trigger")
def cron_trigger(
    secret: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint for external cron services (Cron-job.org / QStash)
    to trigger scheduled agents on Serverless environments (Vercel).
    """
    import os
    import pytz

    expected_secret = os.getenv("CRON_SECRET", "my-agencyos-cron-secret-123")
    if secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret key")

    active_agents = db.query(AgentConfig).filter(AgentConfig.is_active == True).all()
    triggered_agents = []

    for agent in active_agents:
        try:
            tz = pytz.timezone(agent.timezone or "Asia/Jakarta")
        except Exception:
            tz = pytz.timezone("Asia/Jakarta")

        agent_now = datetime.now(tz)
        current_day = agent_now.weekday()  # 0=Mon..6=Sun
        run_days = agent.run_days or [0, 1, 2, 3, 4]

        if current_day not in run_days:
            continue

        try:
            target_h, target_m = map(int, agent.run_time.split(":"))
        except Exception:
            target_h, target_m = 8, 0

        target_minutes = target_h * 60 + target_m
        current_minutes = agent_now.hour * 60 + agent_now.minute

        # Only trigger if current time >= target run_time
        if current_minutes < target_minutes:
            continue

        # Check if already ran today in agent's local timezone
        already_ran_today = False
        if agent.last_run_at:
            last_run_utc = agent.last_run_at.replace(tzinfo=pytz.utc) if agent.last_run_at.tzinfo is None else agent.last_run_at
            last_run_local = last_run_utc.astimezone(tz)
            if last_run_local.date() == agent_now.date():
                already_ran_today = True

        if not already_ran_today:
            # Check if agent is currently running
            running_log = (
                db.query(AgentRunLog)
                .filter(
                    AgentRunLog.agent_id == agent.id,
                    AgentRunLog.status == AgentRunStatus.RUNNING,
                )
                .first()
            )
            if not running_log:
                if agent_scheduler:
                    agent_scheduler.run_now(agent.id)
                else:
                    import threading
                    from backend.services.agent_service import run_agent
                    import asyncio

                    def _run(aid=agent.id):
                        loop = asyncio.new_event_loop()
                        try:
                            loop.run_until_complete(run_agent(aid, trigger="scheduled"))
                        finally:
                            loop.close()

                    threading.Thread(target=_run, daemon=True).start()

                triggered_agents.append({
                    "id": agent.id,
                    "name": agent.name,
                    "run_time": agent.run_time,
                    "timezone": agent.timezone,
                })

    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "triggered_count": len(triggered_agents),
        "triggered_agents": triggered_agents,
    }


@router.get("/{agent_id}")
def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Get agent detail."""
    agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent tidak ditemukan.")
    get_user_workspace(current_user, agent.workspace_id, db)
    return _serialize_agent(agent, db)


@router.patch("/{agent_id}")
def update_agent(
    agent_id: str,
    req: AgentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Update agent configuration. Reschedules if schedule fields change."""
    agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent tidak ditemukan.")
    get_user_workspace(current_user, agent.workspace_id, db)

    schedule_changed = False

    if req.name is not None:
        agent.name = req.name
    if req.description is not None:
        agent.description = req.description
    if req.account_ids is not None:
        agent.account_ids = req.account_ids
    if req.content_pillar is not None:
        agent.content_pillar = req.content_pillar
    if req.content_format is not None:
        agent.content_format = req.content_format
    if req.topic_hint is not None:
        agent.topic_hint = req.topic_hint
    if req.topic_hint == "":
        agent.topic_hint = None
    if req.drafts_per_run is not None:
        agent.drafts_per_run = req.drafts_per_run
    if req.run_time is not None:
        agent.run_time = req.run_time
        schedule_changed = True
    if req.timezone is not None:
        agent.timezone = req.timezone
        schedule_changed = True
    if req.run_days is not None:
        agent.run_days = req.run_days
        schedule_changed = True
    if req.is_active is not None:
        prev_active = agent.is_active
        agent.is_active = req.is_active
        if req.is_active != prev_active:
            schedule_changed = True

    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)

    # Reschedule
    if schedule_changed and agent_scheduler:
        if agent.is_active:
            agent_scheduler.add_agent(agent.id, agent.run_time, agent.timezone, agent.run_days)
        else:
            agent_scheduler.remove_agent(agent.id)

    return _serialize_agent(agent, db)


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Delete an agent and all its run logs."""
    agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent tidak ditemukan.")
    get_user_workspace(current_user, agent.workspace_id, db)

    if agent_scheduler:
        agent_scheduler.remove_agent(agent.id)

    db.query(AgentRunLog).filter(AgentRunLog.agent_id == agent_id).delete()
    db.delete(agent)
    db.commit()

    return {"status": "deleted", "agent_id": agent_id}


@router.post("/{agent_id}/toggle")
def toggle_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Toggle agent active/inactive."""
    agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent tidak ditemukan.")
    get_user_workspace(current_user, agent.workspace_id, db)

    agent.is_active = not agent.is_active
    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)

    if agent_scheduler:
        if agent.is_active:
            agent_scheduler.add_agent(agent.id, agent.run_time, agent.timezone, agent.run_days)
        else:
            agent_scheduler.remove_agent(agent.id)

    return _serialize_agent(agent, db)


@router.post("/{agent_id}/run-now")
def run_agent_now(
    agent_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Trigger an immediate manual run of the agent (non-blocking)."""
    agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent tidak ditemukan.")
    get_user_workspace(current_user, agent.workspace_id, db)

    # Check if already running
    running_log = (
        db.query(AgentRunLog)
        .filter(
            AgentRunLog.agent_id == agent_id,
            AgentRunLog.status == AgentRunStatus.RUNNING,
        )
        .first()
    )
    if running_log:
        raise HTTPException(status_code=409, detail="Agent sudah sedang berjalan. Tunggu hingga selesai.")

    if agent_scheduler:
        agent_scheduler.run_now(agent.id)
    else:
        # Direct thread fallback when scheduler module not available
        import threading
        from backend.services.agent_service import run_agent
        import asyncio
        def _run():
            loop = asyncio.new_event_loop()
            try:
                loop.run_until_complete(run_agent(agent.id, trigger="manual"))
            finally:
                loop.close()
        threading.Thread(target=_run, daemon=True).start()

    return {"status": "triggered", "message": f"Agent '{agent.name}' sedang dijalankan di background."}


@router.get("/{agent_id}/logs")
def get_agent_logs(
    agent_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Get run history for an agent."""
    agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent tidak ditemukan.")
    get_user_workspace(current_user, agent.workspace_id, db)

    logs = (
        db.query(AgentRunLog)
        .filter(AgentRunLog.agent_id == agent_id)
        .order_by(AgentRunLog.started_at.desc())
        .limit(min(limit, 50))
        .all()
    )
    return [_serialize_log(log) for log in logs]


@router.delete("/logs/{log_id}")
def delete_agent_log(
    log_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Delete a single agent run log entry."""
    log = db.query(AgentRunLog).filter(AgentRunLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log hasil agent tidak ditemukan.")
    get_user_workspace(current_user, log.workspace_id, db)

    db.delete(log)
    db.commit()

    return {"status": "deleted", "log_id": log_id}

