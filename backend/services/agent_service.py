"""
Agent Service — Core AI Agent Runner
Mengeksekusi satu AgentConfig: ambil akun + briefing → panggil Gemini AI → simpan draft di AgentRunLog.
Draft TIDAK langsung masuk Post Queue (Opsi B) — user review dulu di halaman /agent.
"""
import logging
import re
import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.agent_models import AgentConfig, AgentRunLog, AgentRunStatus
from backend.models.models import SocialAccount, AccountStatus

import asyncio

logger = logging.getLogger("AgentService")

# Concurrency management
_AGENT_LOCKS: dict = {}
_CONCURRENCY_SEMAPHORE = asyncio.Semaphore(3)  # Max 3 concurrent AI generations across workspace


def _get_agent_lock(agent_id: str) -> asyncio.Lock:
    if agent_id not in _AGENT_LOCKS:
        _AGENT_LOCKS[agent_id] = asyncio.Lock()
    return _AGENT_LOCKS[agent_id]


PLATFORM_ICONS = {
    "instagram": "📸", "facebook": "📘", "x": "𝕏", "tiktok": "🎵",
    "youtube": "▶️", "linkedin": "💼", "pinterest": "📌",
    "bluesky": "🦋", "threads": "🧵", "tiktok_business": "🎵",
}


def _extract_composer_payload(text: str) -> Optional[dict]:
    """Extract ```json ... ``` composer_payload block from AI output."""
    try:
        match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if match:
            parsed = json.loads(match.group(1))
            return parsed.get("composer_payload") or parsed
    except Exception:
        pass
    return None


async def run_agent(agent_id: str, trigger: str = "scheduled") -> dict:
    """
    Core agent runner. Returns summary dict.
    Called by scheduler (trigger="scheduled") or API (trigger="manual").
    Includes concurrency locking and duplicate run protection.
    """
    agent_lock = _get_agent_lock(agent_id)
    if agent_lock.locked():
        logger.info(f"Agent {agent_id} is currently locked by another task, skipping duplicate run.")
        return {"status": "already_running", "error": "Agent is already running."}

    async with agent_lock:
        db: Session = SessionLocal()
        run_log: Optional[AgentRunLog] = None

        try:
            agent = db.query(AgentConfig).filter(AgentConfig.id == agent_id).first()
            if not agent:
                logger.error(f"Agent {agent_id} not found.")
                return {"status": "failed", "error": "Agent not found"}

            if not agent.is_active and trigger == "scheduled":
                logger.info(f"Agent {agent.name} is inactive, skipping scheduled run.")
                return {"status": "skipped"}

            # Double-check DB for existing RUNNING status log
            existing_running = (
                db.query(AgentRunLog)
                .filter(
                    AgentRunLog.agent_id == agent_id,
                    AgentRunLog.status == AgentRunStatus.RUNNING,
                )
                .first()
            )
            if existing_running:
                logger.info(f"Agent {agent_id} has an active RUNNING log in DB. Aborting duplicate execution.")
                return {"status": "already_running", "error": "Agent is already running in background."}

            # Create run log entry
            run_log = AgentRunLog(
                agent_id=agent.id,
                workspace_id=agent.workspace_id,
                status=AgentRunStatus.RUNNING,
                trigger=trigger,
                content_pillar=agent.content_pillar,
                content_format=agent.content_format,
                topic_hint=agent.topic_hint,
                started_at=datetime.utcnow(),
                drafts=[],
                drafts_count=0,
            )
            db.add(run_log)
            db.commit()
            db.refresh(run_log)

            # Load target accounts
            query = db.query(SocialAccount).filter(
                SocialAccount.workspace_id == agent.workspace_id,
                SocialAccount.status == AccountStatus.CONNECTED,
            )
            if agent.account_ids:
                query = query.filter(SocialAccount.id.in_(agent.account_ids))
            accounts = query.all()

            if not accounts:
                _fail_run(db, run_log, agent, "Tidak ada akun terhubung yang ditemukan.")
                return {"status": "failed", "error": "No connected accounts"}

            # Update snapshot of targeted accounts
            run_log.accounts_targeted = [
                {"id": a.id, "username": a.username, "platform": a.platform.value, "name": a.name}
                for a in accounts
            ]
            db.commit()

            # Check briefing availability
            accounts_with_briefing = [
                a for a in accounts
                if a.briefing and any(v for k, v in a.briefing.items() if k != "updated_at" and v)
            ]
            if not accounts_with_briefing:
                _fail_run(
                    db, run_log, agent,
                    "Akun terpilih belum memiliki data Briefing. Silakan lengkapi Briefing Akun di /accounts."
                )
                return {"status": "failed", "error": "No account briefing found"}

            accounts_info = [
                {
                    "id": a.id,
                    "name": a.name,
                    "username": a.username,
                    "platform": a.platform.value,
                    "briefing": a.briefing or {},
                }
                for a in accounts_with_briefing
            ]

            # Call Gemini AI with concurrency semaphore protection
            from backend.services.gemini_service import gemini_service

            topic = agent.topic_hint or "konten harian yang relevan dan engaging"
            num_drafts = max(1, min(getattr(agent, "drafts_per_run", 1) or 1, 2))

            drafts = []
            async with _CONCURRENCY_SEMAPHORE:
                for i in range(1, num_drafts + 1):
                    try:
                        ai_response = await gemini_service.generate_agent_content(
                            accounts_info=accounts_info,
                            content_pillar=agent.content_pillar,
                            content_format=agent.content_format,
                            user_idea=topic,
                            variation_index=i,
                            total_variations=num_drafts,
                            db=db,
                        )
                        composer_payload = _extract_composer_payload(ai_response)
                        clean_brief = re.sub(r"```json\s*[\s\S]*?\s*```", "", ai_response).strip()

                        drafts.append({
                            "accounts": [{"id": a["id"], "username": a["username"], "platform": a["platform"]} for a in accounts_info],
                            "brief_text": clean_brief,
                            "composer_payload": composer_payload,
                            "generated_at": datetime.utcnow().isoformat(),
                        })
                    except Exception as draft_err:
                        logger.warning(f"Error generating variation {i} for agent {agent_id}: {draft_err}")

            if not drafts:
                _fail_run(db, run_log, agent, "Gagal menghasilkan draft konten dari Shiera AI Engine.")
                return {"status": "failed", "error": "AI generation failed"}

            # Update run log → DONE
            run_log.drafts = drafts
            run_log.drafts_count = len(drafts)
            run_log.status = AgentRunStatus.DONE
            run_log.completed_at = datetime.utcnow()
            db.commit()

            # Update agent stats
            agent.last_run_at = datetime.utcnow()
            agent.total_runs = (agent.total_runs or 0) + 1
            agent.total_drafts_generated = (agent.total_drafts_generated or 0) + len(drafts)
            db.commit()

            logger.info(f"✅ Agent '{agent.name}' run complete. {len(drafts)} draft(s) generated.")
            return {
                "status": "done",
                "drafts_count": len(drafts),
                "run_log_id": run_log.id,
            }

        except Exception as e:
            logger.error(f"Agent {agent_id} run error: {e}", exc_info=True)
            if run_log:
                _fail_run(db, run_log, None, str(e))
            return {"status": "failed", "error": str(e)}
        finally:
            db.close()


def _fail_run(db: Session, run_log: AgentRunLog, agent: Optional[AgentConfig], error: str):
    run_log.status = AgentRunStatus.FAILED
    run_log.error_message = error
    run_log.completed_at = datetime.utcnow()
    db.commit()
    if agent:
        agent.last_run_at = datetime.utcnow()
        db.commit()
