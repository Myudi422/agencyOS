"""
Migration Script: Create agent_configs and agent_run_logs tables.
Run: python backend/migrate_agents.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import engine
from backend.models.agent_models import AgentConfig, AgentRunLog
from sqlalchemy import inspect, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migrate_agents")

def run():
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    if "agent_configs" not in existing_tables:
        AgentConfig.__table__.create(bind=engine)
        logger.info("✅ Created table: agent_configs")
    else:
        logger.info("⏭️  Table agent_configs already exists — skipping.")

    if "agent_run_logs" not in existing_tables:
        AgentRunLog.__table__.create(bind=engine)
        logger.info("✅ Created table: agent_run_logs")
    else:
        logger.info("⏭️  Table agent_run_logs already exists — skipping.")

    logger.info("✅ Migration complete.")

if __name__ == "__main__":
    run()
