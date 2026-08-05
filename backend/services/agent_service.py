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

logger = logging.getLogger("AgentService")

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
    """
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

        # Call Gemini AI
        from backend.services.gemini_service import gemini_service

        topic = agent.topic_hint or "konten harian yang relevan dan engaging"
        ai_response = await gemini_service.generate_content_brainstorm(
            accounts_info=accounts_info,
            content_pillar=agent.content_pillar,
            content_format=agent.content_format,
            user_idea=topic,
            chat_history=None,
            db=db,
        )

        # Parse & store drafts
        composer_payload = _extract_composer_payload(ai_response)
        clean_brief = re.sub(r"```json\s*[\s\S]*?\s*```", "", ai_response).strip()

        drafts = [{
            "accounts": [{"id": a["id"], "username": a["username"], "platform": a["platform"]} for a in accounts_info],
            "brief_text": clean_brief,
            "composer_payload": composer_payload,
            "generated_at": datetime.utcnow().isoformat(),
        }]

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
