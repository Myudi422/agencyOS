# AgencyOS - Enterprise Digital Agency Social Management Platform

AgencyOS is an enterprise SaaS platform built for Digital Agencies, Social Media Agencies, Freelancers, Brands, and Enterprises managing hundreds of Instagram Business accounts and Facebook Pages from a unified command workspace.

---

## Key Features MVP 1.0

- **Multi-Workspace & Client Architecture**: Hierarchical organization (`Workspace -> Client -> Instagram Business / Facebook Page`).
- **Enterprise Account Manager**: High-performance system supporting fast search, filtering (platform, status, client, group), sorting, pinning favorites, bulk selection, and virtualized list support up to 500+ accounts.
- **Backblaze B2 S3 Media Storage**: Media metadata tagging, folder organization, image/video upload, and infinite multi-post asset reuse.
- **Multi-Account Post Composer**: Create 1 post, select multiple social target accounts across clients, with live Instagram & Facebook feed previews, image/carousel/video support, captions, hashtags, first comments, locations, and alt text.
- **Upstash Redis & Celery Queue Engine**: Job queueing with exponential backoff retries and individual per-account publishing isolation.
- **Interactive Content Calendar**: Month, Week, and Day views with drag-and-drop post rescheduling.
- **Sub-300ms Executive Dashboard**: Instant counter metrics, active client rosters, and queue status monitor.
- **Audit Activity Logs**: Full tracking of logins, connections, post creations, publish jobs, and disconnects.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: TailwindCSS + Vanilla CSS luxury dark mode (Linear / Vercel design system)
- **State & Data Fetching**: Zustand + TanStack React Query

### Backend
- **Core**: Python FastAPI + Pydantic v2
- **ORM & Database**: SQLAlchemy + Supabase PostgreSQL
- **Queue Engine**: Upstash Redis + Celery workers
- **Storage**: Backblaze B2 S3 Object Storage (`boto3`)
- **Integration**: Meta OAuth 2.0 + Graph API (Instagram Business & Facebook Pages)

---

## Default Configured Credentials

The system is pre-configured with your default credentials:

- **Supabase PostgreSQL**: `https://aocqssdfhozjjrslexub.supabase.co`
- **Upstash Redis Queue**: `https://internal-reptile-121564.upstash.io` (`rediss://...:6379`)
- **Backblaze B2 Storage**: `https://s3.us-east-005.backblazeb2.com` (Bucket: `ccgnimex`)

---

## Getting Started

### 1. Run Backend (FastAPI)
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`

### 2. Run Frontend (Next.js 15)
```bash
cd frontend
npm run dev
```
- Web Dashboard: `http://localhost:3000`
