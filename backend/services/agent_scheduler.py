"""
Agent Scheduler — APScheduler wrapper for Shiera AI Agent system.
Uses BackgroundScheduler (in-process) with CronTrigger.
Loaded at FastAPI startup, loads all active AgentConfigs from DB.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("AgentScheduler")

_scheduler: Optional[BackgroundScheduler] = None

# Weekday map: APScheduler cron uses mon, tue, wed, thu, fri, sat, sun
_DAY_MAP = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}


def _run_agent_sync(agent_id: str, trigger: str = "scheduled"):
    """Bridge: runs async agent_service.run_agent inside a new event loop."""
    from backend.services.agent_service import run_agent
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(run_agent(agent_id, trigger=trigger))
    finally:
        loop.close()


def _build_cron_days(run_days: list) -> str:
    """Convert list of day ints [0,1,2,3,4] → 'mon,tue,wed,thu,fri' for APScheduler."""
    if not run_days:
        return "mon-sun"
    return ",".join(_DAY_MAP[d] for d in sorted(run_days) if d in _DAY_MAP)


def start():
    """Initialize and start the scheduler. Load all active agents from DB."""
    global _scheduler
    if _scheduler and _scheduler.running:
        logger.info("Scheduler already running.")
        return

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.start()
    logger.info("✅ AgentScheduler started.")

    _load_all_active_agents()


def shutdown():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("AgentScheduler stopped.")


def _load_all_active_agents():
    """Load all active AgentConfigs from DB and schedule them."""
    try:
        from backend.database import SessionLocal
        from backend.models.agent_models import AgentConfig

        db = SessionLocal()
        try:
            agents = db.query(AgentConfig).filter(AgentConfig.is_active == True).all()
            logger.info(f"Loading {len(agents)} active agent(s) into scheduler...")
            for agent in agents:
                _schedule_agent(agent.id, agent.run_time, agent.timezone, agent.run_days)
            logger.info(f"✅ {len(agents)} agent(s) scheduled.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to load agents from DB: {e}", exc_info=True)


def _schedule_agent(agent_id: str, run_time: str, timezone: str, run_days: list):
    """Add or replace a cron job for an agent."""
    if not _scheduler:
        return

    try:
        hour, minute = map(int, run_time.split(":"))
        day_str = _build_cron_days(run_days)

        job_id = f"agent_{agent_id}"

        # Remove existing job if any
        if _scheduler.get_job(job_id):
            _scheduler.remove_job(job_id)

        _scheduler.add_job(
            _run_agent_sync,
            trigger=CronTrigger(day_of_week=day_str, hour=hour, minute=minute, timezone=timezone),
            id=job_id,
            args=[agent_id, "scheduled"],
            replace_existing=True,
            misfire_grace_time=3600,  # Allow up to 1h late if server was down
            coalesce=True,            # Don't run multiple if missed
        )

        next_run = _scheduler.get_job(job_id)
        next_fire = next_run.next_run_time if next_run else None
        logger.info(f"✅ Agent {agent_id} scheduled at {run_time} ({timezone}) on [{day_str}]. Next: {next_fire}")
        return next_fire

    except Exception as e:
        logger.error(f"Failed to schedule agent {agent_id}: {e}")


def add_agent(agent_id: str, run_time: str, timezone: str, run_days: list) -> Optional[datetime]:
    """Public API: schedule a new agent or update existing."""
    return _schedule_agent(agent_id, run_time, timezone, run_days)


def remove_agent(agent_id: str):
    """Public API: remove agent's scheduled job."""
    if not _scheduler:
        return
    job_id = f"agent_{agent_id}"
    if _scheduler.get_job(job_id):
        _scheduler.remove_job(job_id)
        logger.info(f"Removed scheduled job for agent {agent_id}")


def get_next_run(agent_id: str) -> Optional[datetime]:
    """Return the next scheduled run datetime for an agent."""
    if not _scheduler:
        return None
    job = _scheduler.get_job(f"agent_{agent_id}")
    if job:
        return job.next_run_time
    return None


def run_now(agent_id: str):
    """Trigger an agent run immediately (async, non-blocking)."""
    if not _scheduler:
        # Fallback: run directly
        _run_agent_sync(agent_id, trigger="manual")
        return
    _scheduler.add_job(
        _run_agent_sync,
        args=[agent_id, "manual"],
        id=f"agent_{agent_id}_manual_{datetime.utcnow().timestamp()}",
        replace_existing=False,
        max_instances=1,
    )
