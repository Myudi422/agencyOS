# 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)

Panduan teknis dan roadmap infrastruktur untuk menaikkan kapasitas server AgencyOS dari skala ribuan hingga 100,000+ pengguna aktif bersamaan (Concurrent Users).

---

## 📊 1. Matriks Kapasitas Infrastruktur

| Parameter | Kapasitas Saat Ini (MVP) | Target Skala Medium (10k Users) | Target Skala Enterprise (100k Users) |
| :--- | :--- | :--- | :--- |
| **Concurrent Users (CCU)** | 100 – 500 CCU | 5,000 – 10,000 CCU | 100,000+ CCU |
| **Requests Per Second (RPS)** | ~50 RPS | ~1,500 RPS | ~15,000+ RPS |
| **Database Pool** | Supabase Port 6543 (Transaction) | Supabase Dedicated / AWS Aurora | Distributed PostgreSQL + Read Replicas |
| **Queue Worker** | FastAPI In-Process BackgroundTasks | Redis + Celery / ARQ (3 Workers) | Redis Cluster + Distributed Worker Autoscaling |
| **Caching Layer** | Python In-Memory TTL Cache | Centralized Redis Cache (Upstash) | Redis Cluster + CDN (Cloudflare Enterprise) |

---

## 🏗️ 2. Roadmap Upscaling Bertahap

```mermaid
graph TD
    A[Stage 1: Current Architecture] -->|Trafik > 1,000 CCU| B[Stage 2: Centralized Redis & Worker Separation]
    B -->|Trafik > 10,000 CCU| C[Stage 3: Database Read Replicas & CDN Caching]
    C -->|Trafik > 100,000 CCU| D[Stage 4: Microservices & Event-Driven Architecture]
```

---

## 🛠️ 3. Langkah Implementasi Upscaling

### 🔹 Tahap 1: Pemisahan Queue Worker dengan Redis (Rekomendasi Utama)

Saat pengguna aktif melonjak, memproses publikasi media di thread FastAPI utama akan memakan memori CPU. Pisahkan worker publikasi ke antrean Redis.

#### A. Install Dependencies
```bash
pip install celery redis arq
```

#### B. Konfigurasi Redis Queue (`backend/services/redis_queue.py`)
```python
import os
from arq import create_pool
from arq.connections import RedisSettings

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

async def get_redis_pool():
    return await create_pool(RedisSettings.from_dsn(REDIS_URL))

# Task Publisher
async def publish_post_task(ctx, post_id: str):
    from backend.database import SessionLocal
    from backend.services.queue_service import queue_service
    db = SessionLocal()
    try:
        await queue_service.enqueue_post_publishing(db, post_id)
    finally:
        db.close()
```

---

### 🔹 Tahap 2: Centralized Redis Caching (Gantikan In-Memory Cache)

Ubah cache in-memory di `calendar.py` & `statistics.py` menjadi Redis Centralized Cache agar semua instance server berbagi cache yang sama:

```python
import json
import aioredis
from typing import Optional

redis_client = aioredis.from_url(os.getenv("REDIS_URL"))

async def get_cached_calendar(cache_key: str) -> Optional[dict]:
    data = await redis_client.get(cache_key)
    return json.loads(data) if data else None

async def set_cached_calendar(cache_key: str, data: dict, ttl: int = 120):
    await redis_client.set(cache_key, json.dumps(data), ex=ttl)
```

---

### 🔹 Tahap 3: Tuning Database Connection Pool (Supabase & PostgreSQL)

Bila koneksi DB meningkat tajam, pastikan parameter `engine` di `backend/database.py` disesuaikan:

```python
# backend/database.py untuk Skala Tinggi
engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_size=20,           # Jumlah koneksi persisten
    max_overflow=40,        # Maksimal burst koneksi tambahan saat peak
    pool_timeout=30,        # Batas tunggu koneksi sebelum timeout
    pool_recycle=1800,      # Daur ulang koneksi tiap 30 menit
    pool_pre_ping=True      # Cek kesehatan koneksi sebelum digunakan
)
```

> ⚠️ **Catatan penting Supabase**:
> Gunakan **Port 6543 (Transaction Mode PgBouncer)** untuk semua endpoint FastAPI serverless/cloud. Jangan gunakan Port 5432 di production serverless.

---

## 🧪 4. Load Testing & Benchmark Scripts

Gunakan script **Locust** di bawah ini untuk menguji ketahanan server API sebelum launching kampanye skala besar.

### Script Locust (`tests/load_test.py`):

```python
from locust import HttpUser, task, between
import random

class AgencyOSUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Header simulasi user autentikasi
        self.headers = {
            "Authorization": "Bearer TEST_FIREBASE_JWT_TOKEN",
            "Content-Type": "application/json"
        }

    @task(3)
    def test_get_calendar(self):
        self.client.get(
            "/api/backend/calendar/?workspace_id=ws-test&year=2026&month=7",
            headers=self.headers,
            name="GET /calendar"
        )

    @task(2)
    def test_get_statistics(self):
        self.client.get(
            "/api/backend/statistics/?workspace_id=ws-test",
            headers=self.headers,
            name="GET /statistics"
        )

    @task(1)
    def test_get_queue_history(self):
        self.client.get(
            "/api/backend/queue/history?workspace_id=ws-test&limit=20",
            headers=self.headers,
            name="GET /queue/history"
        )
```

### Jalankan Load Test:
```bash
pip install locust
locust -f tests/load_test.py --host=https://shiera.web.id
```

---

## 📈 5. Monitoring & Alerting Checklist

Pastikan metriks berikut dipantau menggunakan Grafana / Datadog / New Relic:

- [ ] **CPU Usage**: Alert jika > 80% selama 5 menit berturut-turut.
- [ ] **Memory Usage**: Alert jika > 85% (indikasi memory leak).
- [ ] **PostgreSQL Active Connections**: Alert jika mendekati 80% dari max limit.
- [ ] **Redis Queue Lag**: Alert jika penumpukan job antrean > 500 jobs.
- [ ] **PostForMe API Latency**: Monitor response time HTTP 200/400/500 dari endpoint `/v1/social-posts`.

---

## 📌 Kesimpulan Ringkas

1. **Hari Ini (MVP - 500 CCU)**: Setup saat ini dengan Port 6543 Supabase + TTL Cache sudah berjalan lancar & hemat biaya.
2. **Saat Capai 1,000+ CCU**: Tambahkan **Upstash Redis** untuk memisahkan `BackgroundTasks` dari server API utama.
3. **Saat Capai 10,000+ CCU**: Aktifkan **Auto-scaling Instance** (FastAPI) + **Database Read Replicas**.
