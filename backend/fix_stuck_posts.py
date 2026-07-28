"""
Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang ada di database,
update status target ke PUBLISHED/FAILED, update status job ke SUCCESS, dan buat record di post_publish_results.
"""
import sys
import asyncio
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

from backend.database import SessionLocal
from backend.models.models import Post, PostTarget, PublishJob, PostPublishResult, PostStatus, JobStatus
from backend.services.postforme_service import postforme_service
from backend.services.queue_service import queue_service

async def main():
    db = SessionLocal()
    try:
        print("[1] Fetching recent post results from PostForMe API...")
        results_res = await postforme_service.get_post_results(limit=100)
        data_list = results_res.get("data", [])
        print(f"[OK] Fetched {len(data_list)} results from PostForMe.")

        # Ambil semua PostTarget yang statusnya PUBLISHING atau belum ada publish result
        targets = db.query(PostTarget).all()
        print(f"[2] Checking {len(targets)} post targets in DB...")

        fixed_count = 0
        for target in targets:
            post = target.post
            if not post:
                continue

            # Cari result matching di data_list
            matching_res = None
            for res_item in data_list:
                pf_post_id = res_item.get("post_id")
                if target.platform_post_id and target.platform_post_id == pf_post_id:
                    matching_res = res_item
                    break
                if post.postforme_post_id and post.postforme_post_id == pf_post_id:
                    matching_res = res_item
                    break

            if not matching_res and data_list:
                # Fallback: jika hanya ada 1 target publishing & 1 result terbaru
                if target.status == PostStatus.PUBLISHING:
                    matching_res = data_list[0]
                    if matching_res.get("post_id"):
                        target.platform_post_id = matching_res["post_id"]
                        post.postforme_post_id = matching_res["post_id"]
                        db.commit()

            if matching_res:
                print(f" -> Found matching PostForMe result for target {target.id}: post_id={matching_res.get('post_id')}, success={matching_res.get('success')}")
                await queue_service._apply_result_to_target(db, target, matching_res, source="fix_script")
                fixed_count += 1
            else:
                # Jika job status masih PROCESSING tapi target tidak terikat, update job jika sudah ada target PUBLISHED
                job = db.query(PublishJob).filter(PublishJob.post_target_id == target.id).first()
                if job and job.status == JobStatus.PROCESSING:
                    if target.status == PostStatus.PUBLISHED:
                        job.status = JobStatus.SUCCESS
                        db.commit()
                        print(f" -> Updated stuck job {job.id} to SUCCESS")
                    elif target.status == PostStatus.FAILED:
                        job.status = JobStatus.FAILED
                        db.commit()
                        print(f" -> Updated stuck job {job.id} to FAILED")

        print(f"\n[DONE] Fixed {fixed_count} post targets and updated history!")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
