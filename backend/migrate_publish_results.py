"""
Migration: Tambah tabel post_publish_results dan kolom baru ke posts.
Jalankan: python backend/migrate_publish_results.py
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import types, importlib.machinery
if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(backend_dir)]
    backend_pkg.__file__ = str(backend_dir / "__init__.py")
    backend_pkg.__spec__ = importlib.machinery.ModuleSpec("backend", None, is_package=True)
    sys.modules["backend"] = backend_pkg

from backend.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # 1. Tambah kolom created_by_user_id ke tabel posts (jika belum ada)
        try:
            conn.execute(text("""
                ALTER TABLE posts 
                ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL
            """))
            print("[OK] Kolom created_by_user_id ditambahkan ke posts")
        except Exception as e:
            print(f"[INFO] created_by_user_id: {e}")

        # 2. Buat tabel post_publish_results (jika belum ada)
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS post_publish_results (
                    id VARCHAR(36) PRIMARY KEY,
                    post_target_id VARCHAR(36) NOT NULL REFERENCES post_targets(id) ON DELETE CASCADE,
                    postforme_result_id VARCHAR(255),
                    postforme_post_id VARCHAR(255),
                    social_account_id VARCHAR(255),
                    success BOOLEAN,
                    platform_url TEXT,
                    platform_post_id VARCHAR(255),
                    error_data JSONB,
                    raw_result JSONB,
                    credit_deducted BOOLEAN NOT NULL DEFAULT FALSE,
                    source VARCHAR(50) NOT NULL DEFAULT 'sync',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("[OK] Tabel post_publish_results dibuat")
        except Exception as e:
            print(f"[INFO] post_publish_results: {e}")

        # 3. Buat index untuk performa query
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ppr_postforme_result_id ON post_publish_results(postforme_result_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ppr_postforme_post_id ON post_publish_results(postforme_post_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ppr_post_target_id ON post_publish_results(post_target_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_posts_created_by_user_id ON posts(created_by_user_id)"))
            print("[OK] Index dibuat")
        except Exception as e:
            print(f"[INFO] Index: {e}")

        conn.commit()
        print("\n[DONE] Migration selesai!")


if __name__ == "__main__":
    run_migration()
