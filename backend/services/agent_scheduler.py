"""
Agent Scheduler — APScheduler wrapper for Shiera AI Agent system.

Vercel/Serverless awareness:
- Vercel is stateless serverless → BackgroundScheduler threads die per request.
- On Vercel: scheduler is a no-op stub. "Run Now" (manual trigger) still works.
- On a persistent server (Railway, VPS, etc.): full scheduler with cron runs.
"""
import asyncio
import logging
import os
from datetime import datetime
from typing import Optional

logger = logging.getLogger("AgentScheduler")

# Detect if running in a serverless environment
_IS_SERVERLESS = bool(
    os.getenv("VERCEL") or
    os.getenv("AWS_LAMBDA_FUNCTION_NAME") or
    os.getenv("FUNCTION_NAME")
)

_scheduler = None

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
    """Initialize and start the scheduler. No-op on serverless environments."""
    global _scheduler

    if _IS_SERVERLESS:
        logger.info("⚡ Serverless environment detected — APScheduler skipped (use manual run-now or external cron).")
        return

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
    except ImportError:
        logger.warning("apscheduler not installed — scheduler disabled.")
        return

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
    if _IS_SERVERLESS or not _scheduler:
        return
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
    """Add or replace a cron job for an agent. No-op on serverless."""
    if _IS_SERVERLESS or not _scheduler:
        return None
    try:
        from apscheduler.triggers.cron import CronTrigger

        hour, minute = map(int, run_time.split(":"))
        day_str = _build_cron_days(run_days)
        job_id = f"agent_{agent_id}"

        if _scheduler.get_job(job_id):
            _scheduler.remove_job(job_id)

        _scheduler.add_job(
            _run_agent_sync,
            trigger=CronTrigger(day_of_week=day_str, hour=hour, minute=minute, timezone=timezone),
            id=job_id,
            args=[agent_id, "scheduled"],
            replace_existing=True,
            misfire_grace_time=3600,
            coalesce=True,
        )

        job = _scheduler.get_job(job_id)
        next_fire = job.next_run_time if job else None
        logger.info(f"✅ Agent {agent_id} scheduled at {run_time} ({timezone}) on [{day_str}]. Next: {next_fire}")
        return next_fire

    except Exception as e:
        logger.error(f"Failed to schedule agent {agent_id}: {e}")
        return None


def add_agent(agent_id: str, run_time: str, timezone: str, run_days: list) -> Optional[datetime]:
    """Public API: schedule a new agent or update existing."""
    return _schedule_agent(agent_id, run_time, timezone, run_days)


def remove_agent(agent_id: str):
    """Public API: remove agent's scheduled job."""
    if _IS_SERVERLESS or not _scheduler:
        return
    job_id = f"agent_{agent_id}"
    if _scheduler.get_job(job_id):
        _scheduler.remove_job(job_id)
        logger.info(f"Removed scheduled job for agent {agent_id}")


def get_next_run(agent_id: str) -> Optional[datetime]:
    """Return next scheduled run datetime. Returns None on serverless."""
    if _IS_SERVERLESS or not _scheduler:
        return None
    job = _scheduler.get_job(f"agent_{agent_id}")
    return job.next_run_time if job else None


def run_now(agent_id: str):
    """
    Trigger an agent run immediately.
    On serverless: runs directly in a new thread (fire-and-forget).
    On persistent server: uses scheduler's add_job.
    """
    import threading

    if _IS_SERVERLESS or not _scheduler:
        # Serverless fallback: run in a daemon thread
        t = threading.Thread(target=_run_agent_sync, args=(agent_id, "manual"), daemon=True)
        t.start()
        logger.info(f"Agent {agent_id} triggered in background thread (serverless mode).")
        return

    _scheduler.add_job(
        _run_agent_sync,
        args=[agent_id, "manual"],
        id=f"agent_{agent_id}_manual_{datetime.utcnow().timestamp()}",
        replace_existing=False,
        max_instances=1,
    )
