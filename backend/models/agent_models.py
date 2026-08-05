"""
Agent Models — Shiera AI Agent System
Stores agent configurations and run history.
"""
import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, Enum, JSON
from backend.database import Base


def _gen_uuid():
    return str(uuid.uuid4())


class AgentRunStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    SKIPPED = "skipped"


class AgentConfig(Base):
    """
    Konfigurasi satu AI Agent per workspace.
    Satu agent = 1 jadwal otomatis yang menghasilkan brief draft konten.
    """
    __tablename__ = "agent_configs"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    workspace_id = Column(String(36), nullable=False, index=True)
    created_by_user_id = Column(String(36), nullable=True)

    # Identity
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Target accounts (JSON list of social_account IDs)
    account_ids = Column(JSON, nullable=False, default=list)

    # Content config
    content_pillar = Column(String(100), nullable=False)   # e.g. "Edukasi & Tips"
    content_format = Column(String(50), nullable=False)    # e.g. "carousel", "video", "auto"
    topic_hint = Column(Text, nullable=True)               # Optional seed topic/idea
    drafts_per_run = Column(Integer, default=1, nullable=False) # Number of draft options per run (1-5)

    # Schedule config
    run_time = Column(String(5), nullable=False, default="08:00")   # HH:MM in workspace timezone
    timezone = Column(String(100), nullable=False, default="Asia/Jakarta")
    run_days = Column(JSON, nullable=False, default=lambda: [0, 1, 2, 3, 4])  # 0=Mon..6=Sun
    is_active = Column(Boolean, default=True, nullable=False)

    # Runtime tracking
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    total_runs = Column(Integer, default=0, nullable=False)
    total_drafts_generated = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentRunLog(Base):
    """
    Log setiap kali agent dijalankan (manual atau terjadwal).
    Menyimpan hasil brief AI sebagai teks — user bisa buka & transfer ke PostComposer.
    """
    __tablename__ = "agent_run_logs"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    agent_id = Column(String(36), nullable=False, index=True)
    workspace_id = Column(String(36), nullable=False, index=True)

    status = Column(Enum(AgentRunStatus), default=AgentRunStatus.PENDING, nullable=False, index=True)
    trigger = Column(String(20), default="scheduled", nullable=False)  # "scheduled" | "manual"

    # Context snapshot at run time
    accounts_targeted = Column(JSON, nullable=True)   # [{id, username, platform}]
    content_pillar = Column(String(100), nullable=True)
    content_format = Column(String(50), nullable=True)
    topic_hint = Column(Text, nullable=True)

    # AI output — stored as raw markdown/text
    # Each entry: {account_id, username, platform, brief_text, composer_payload}
    drafts = Column(JSON, nullable=True, default=list)
    drafts_count = Column(Integer, default=0, nullable=False)

    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
