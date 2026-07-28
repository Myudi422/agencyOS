"""
Database Migration — WA OTP Verification
Menambah kolom phone_number & phone_verified ke tabel users,
dan membuat tabel wa_otp_verifications.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from backend.database import engine


def migrate():
    print("[START] Migrating: WA OTP Verification schema...")
    with engine.begin() as conn:

        # ── users table ──────────────────────────────────────────────────────
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) DEFAULT NULL;"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE NOT NULL;"
        ))
        # Unique index on phone_number (partial — hanya baris yang ada nilainya)
        conn.execute(text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_number
            ON users (phone_number)
            WHERE phone_number IS NOT NULL;
            """
        ))

        # ── wa_otp_verifications table ────────────────────────────────────────
        conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS wa_otp_verifications (
                id           VARCHAR(36)  PRIMARY KEY,
                user_id      VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                phone_number VARCHAR(20)  NOT NULL,
                otp_code     VARCHAR(6)   NOT NULL,
                is_used      BOOLEAN      NOT NULL DEFAULT FALSE,
                is_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
                expires_at   TIMESTAMP    NOT NULL,
                last_sent_at TIMESTAMP    NOT NULL DEFAULT NOW(),
                created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
            );
            """
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_wa_otp_phone ON wa_otp_verifications (phone_number);"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_wa_otp_user ON wa_otp_verifications (user_id);"
        ))

    print("[OK] WA OTP migration complete!")
    print("   - users.phone_number (VARCHAR 20, UNIQUE)")
    print("   - users.phone_verified (BOOLEAN)")
    print("   - Table: wa_otp_verifications")


if __name__ == "__main__":
    migrate()
