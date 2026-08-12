# Graph Report - agencyOS  (2026-08-12)

## Corpus Check
- 145 files · ~772,979 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1490 nodes · 3408 edges · 84 communities (63 shown, 21 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 421 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a3a535d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/page.tsx
- useStore
- models.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- User
- Session
- admin.py
- posts.py
- agent_service.py
- main.py
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- ShieraAiReportWidget.tsx
- sanitize_text
- fetchApi
- InstagrapiService
- billing.py
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- SecurityMiddleware
- ActivityLog
- queue/page.tsx
- YTPlayer
- Components
- MetaAdapter
- get_user_workspace
- 3. Routers & Endpoints (Backend)
- Session
- app/page.tsx
- package.json
- services
- server.js
- queue.py
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- migrate_account_briefing.py
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- kol.py
- migrate_db.py
- auth.py
- next.config.js
- next-env.d.ts
- useAuthStore
- date-fns
- WorkspaceMember
- migrate_kol.py
- KolDatabaseDrawer.tsx
- next
- QueueService
- Token-efficient agent
- migrate_kol_stats.py
- firebase
- rules/token-efficient.md
- migrate_post_ai_brief.py
- workflows/token-efficient.md
- get_activity_logs
- zustand
- migrate_publish_results.py
- migrate_wa_otp.py
- kol-campaigns/page.tsx
- tailwind-merge
- StorageService
- config.py
- accounts/page.tsx
- idempotency_service.py
- AppTour.tsx
- clsx
- html2canvas

## God Nodes (most connected - your core abstractions)
1. `User` - 151 edges
2. `fetchApi()` - 65 edges
3. `ActivityLog` - 57 edges
4. `SocialAccount` - 53 edges
5. `WorkspaceMember` - 44 edges
6. `useStore` - 44 edges
7. `get_user_workspace()` - 43 edges
8. `Workspace` - 39 edges
9. `UserSubscription` - 31 edges
10. `useAuthStore` - 31 edges

## Surprising Connections (you probably didn't know these)
- `AgentCreateRequest` --uses--> `AgentConfig`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py
- `AgentUpdateRequest` --uses--> `AgentConfig`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py
- `BulkDeleteLogsRequest` --uses--> `AgentConfig`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py
- `AgentCreateRequest` --uses--> `AgentRunLog`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py
- `AgentUpdateRequest` --uses--> `AgentRunLog`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py

## Import Cycles
- None detected.

## Communities (84 total, 21 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "useStore"
Cohesion: 0.13
Nodes (15): OAuthCallbackHandler(), CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, DashboardImageThumbnail(), DashboardPage() (+7 more)

### Community 2 - "models.py"
Cohesion: 0.44
Nodes (24): AccountPlatform, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType, KolPaymentStatus (+16 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.09
Nodes (26): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+18 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "User"
Cohesion: 0.11
Nodes (31): get_db(), AccountStatus, User, Reset Subscriptions Script — Clears all user subscriptions in DB. Run: python…, AccountBriefingSchema, BulkActionRequest, delete_account(), get_accounts() (+23 more)

### Community 7 - "Session"
Cohesion: 0.14
Nodes (19): bulk_delete_media(), bulk_move_media(), delete_folder(), delete_media(), get_media_items(), delete, get, post (+11 more)

### Community 8 - "admin.py"
Cohesion: 0.10
Nodes (43): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Setting, SubscriptionPlan, SubscriptionStatus, assign_plan_by_email(), AssignPlanByEmailRequest, delete_setting() (+35 more)

### Community 9 - "posts.py"
Cohesion: 0.25
Nodes (22): Post, PostStatus, PostTarget, PostType, Subscription aktif milik satu user., UserSubscription, BaseModel, RescheduleRequest (+14 more)

### Community 10 - "agent_service.py"
Cohesion: 0.25
Nodes (10): _extract_composer_payload(), _fail_run(), _get_agent_lock(), AgentConfig, AgentRunLog, Session, Agent Service — Core AI Agent Runner Mengeksekusi satu AgentConfig: ambil akun…, Extract ```json ... ``` composer_payload block from AI output. (+2 more)

### Community 11 - "main.py"
Cohesion: 0.15
Nodes (9): get, root(), Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, Base, Agent Models — Shiera AI Agent System Stores agent configurations and run…, Konfigurasi satu AI Agent per workspace. Satu agent = 1 jadwal otomatis yang… (+1 more)

### Community 12 - "statistics.py"
Cohesion: 0.08
Nodes (45): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, put (+37 more)

### Community 13 - "agent_scheduler.py"
Cohesion: 0.13
Nodes (20): add_agent(), _build_cron_days(), get_next_run(), _load_all_active_agents(), datetime, Agent Scheduler — APScheduler wrapper for Shiera AI Agent system.…, Add or replace a cron job for an agent. No-op on serverless., Public API: schedule a new agent or update existing. (+12 more)

### Community 14 - ".apply_watermark"
Cohesion: 0.20
Nodes (8): Any, Watermark Service — High Performance Image Watermarking Engine for agencyOS…, Returns base64 data URI string of watermarked image for frontend live preview., Calculates top-left (X, Y) coordinate for watermark placement based on 9-point…, Download remote logo image via httpx., Applies a watermark (Text or Image Logo) onto the base image. Config schema: {…, WatermarkService, Image

### Community 15 - "GeminiService"
Cohesion: 0.11
Nodes (23): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+15 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 17 - "ShieraAiReportWidget.tsx"
Cohesion: 0.11
Nodes (15): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+7 more)

### Community 18 - "sanitize_text"
Cohesion: 0.12
Nodes (22): approve_public_post_review(), create_media_upload_url(), delete_post(), generate_ai_caption(), get_posts(), get_public_post_review(), patch_post(), delete (+14 more)

### Community 19 - "fetchApi"
Cohesion: 0.09
Nodes (28): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, CampaignDetailPage(), DELIVERABLE_STATUS_COLORS (+20 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.08
Nodes (26): InstagrapiService, Any, Session, Fetch configured Residential Proxy setting from DB or parameters., Test proxy connectivity by querying public IP checkers., Create an instagrapi Client preconfigured with Proxy, Bandwidth Optimizations &…, Connects to IMAP mail server (e.g. Gmail) to automatically search and extract…, Handler called by instagrapi when Instagram forces a password change during… (+18 more)

### Community 21 - "billing.py"
Cohesion: 0.14
Nodes (31): Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., WaOtpVerification, _activate_user_subscription(), CheckoutRequest, create_checkout(), get_frontend_url(), get_subscription(), _get_user_from_auth() (+23 more)

### Community 22 - "Component: Firebase Auth (Backend)"
Cohesion: 0.06
Nodes (35): AgencyOS — Account Management, Firebase Auth, Stripe Billing & Admin Settings, Alur Lengkap (Flow), Automated Tests, Component: Firebase Auth (Backend), Component: Firebase Auth (Frontend), Future Improvements (Task List for AI), Manual Verification, [MODIFY] `backend/config.py` (+27 more)

### Community 23 - "devDependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+7 more)

### Community 24 - "Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center"
Cohesion: 0.06
Nodes (35): 1. Global Pill Search Bar (`search-bar-pill`), 🎨 1. Shiera Airbnb Design System (Purple Edition), 2. Category Pill Strip Filter (`category-strip`), 🔍 2. Component Design Specifications (Airbnb Style), 3. Feature Cards (Property Card Style), 🚀 3. SEO & Metadata Strategy, 4. Airbnb Rating Banner & Testimonial Display, 📐 4. Landing Page Wireframe & Copywriting (Airbnb Layout) (+27 more)

### Community 25 - "midtrans_service.py"
Cohesion: 0.16
Nodes (14): create_snap_transaction(), get_core_api_client(), get_snap_client(), get_transaction_status(), Any, Midtrans Service — Snap Payment Gateway Integration (Sandbox / Production)…, Returns an initialized Midtrans Snap client., Returns an initialized Midtrans CoreApi client (for transaction status queries). (+6 more)

### Community 26 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, jspdf, lucide-react, react, react-dom, react-is, recharts, @tanstack/react-query (+7 more)

### Community 27 - "SecurityMiddleware"
Cohesion: 0.26
Nodes (5): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware, Lock

### Community 28 - "ActivityLog"
Cohesion: 0.31
Nodes (13): ActivityLog, Media, BulkDeleteRequest, BulkMoveRequest, MediaUpdate, BaseModel, Resets all media assets for the workspace from Backblaze B2 'AgencyOS/' and…, Registers an external media URL (e.g. from PostForMe CDN) into the Media DB… (+5 more)

### Community 29 - "queue/page.tsx"
Cohesion: 0.19
Nodes (12): isDatePast(), LocalPost, LocalPostStatus, PfPost, PfResult, PLATFORM_COLORS, PLATFORM_ICONS, QueuePage() (+4 more)

### Community 30 - "YTPlayer"
Cohesion: 0.17
Nodes (7): AgentHealth, ClipResult, JobStatus, ManualSegment, Window, YtClipperPage(), YTPlayer

### Community 31 - "Components"
Cohesion: 0.06
Nodes (31): Brand & Accent, Buttons, Collapsing Strategy, Colors, Components, Date Picker, Elevation, Font Family (+23 more)

### Community 32 - "MetaAdapter"
Cohesion: 0.15
Nodes (7): MetaAdapter, Any, Adapter for Meta Graph API (Instagram Business API & Facebook Page API).…, Publishes post to Instagram Business via Graph API container flow., Publishes post to Facebook Page via Graph API., Exchanges OAuth auth code for short-lived access token, then long-lived access…, Fetches connected Facebook Pages and associated Instagram Business Accounts.

### Community 33 - "get_user_workspace"
Cohesion: 0.07
Nodes (55): bulk_action(), get_account_briefing(), get_account_watermark(), delete, get, post, put, Session (+47 more)

### Community 34 - "3. Routers & Endpoints (Backend)"
Cohesion: 0.09
Nodes (22): 1. Configuration & Models (Backend), 2. PostForMe Service & Queue Engine (Backend), 3. Routers & Endpoints (Backend), 4. Frontend UI Rework, Automated Tests, Implementation Plan - PostForMe API Integration & Full Platform Overhaul, Manual Verification, [MODIFY] [accounts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/accounts.py) (+14 more)

### Community 35 - "Session"
Cohesion: 0.11
Nodes (23): cancel_postforme_post(), delete_queue_job(), _fallback_local_results(), get_postforme_posts(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks (+15 more)

### Community 36 - "app/page.tsx"
Cohesion: 0.24
Nodes (6): CATEGORIES, DEFAULT_PRICING_PLANS, FAQS, FEATURES, LandingHomePage(), TARGET_AUDIENCE

### Community 37 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 38 - "services"
Cohesion: 0.22
Nodes (8): entrypoint, root, framework, root, rewrites, services, backend, frontend

### Community 39 - "server.js"
Cohesion: 0.33
Nodes (5): app, { createServer }, handle, next, { parse }

### Community 40 - "queue.py"
Cohesion: 0.13
Nodes (20): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, PostPublishResult, PublishJob, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, list_postforme_webhooks(), postforme_webhook(), _process_post_result_event() (+12 more)

### Community 41 - "AgencyOS Backend Documentation"
Cohesion: 0.11
Nodes (17): AgencyOS Backend Documentation, **Atau Jika Berada di Dalam Folder `backend` (dengan venv aktif):**, **Dari Folder Root `agencyOS`:**, **Di Linux / macOS:**, **Di Windows (Command Prompt / CMD):**, **Di Windows (PowerShell):**, 🛠️ Langkah 1: Pindah ke Direktori Backend, 🐍 Langkah 2: Membuat Virtual Environment (`venv`) (+9 more)

### Community 42 - "🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)"
Cohesion: 0.13
Nodes (14): 📊 1. Matriks Kapasitas Infrastruktur, 🏗️ 2. Roadmap Upscaling Bertahap, 🛠️ 3. Langkah Implementasi Upscaling, 🧪 4. Load Testing & Benchmark Scripts, 📈 5. Monitoring & Alerting Checklist, A. Install Dependencies, 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`), B. Konfigurasi Redis Queue (`backend/services/redis_queue.py`) (+6 more)

### Community 44 - "🛠️ 2. Komponen Teknis Terimplementasi"
Cohesion: 0.15
Nodes (12): 🚀 1. Overview & Arsitektur Sistem, 🛠️ 2. Komponen Teknis Terimplementasi, 🔮 3. Roadmap Optimalisasi Skala Besar (Production Scale), 📌 4. Ringkasan File Terkait, A. Dual Engine, Fallback & Automated WhatsApp Alert System (`backend/services/gemini_service.py` & `backend/services/fonnte_service.py`), B. Admin Control Panel Configuration (`backend/routers/admin.py` & `frontend/src/app/admin/page.tsx`), C. Clean Markdown Renderer (`frontend/src/components/common/ShieraMarkdownViewer.tsx`), D. Global Chat Drawer & Floating Minimize Widget (`frontend/src/components/common/ShieraAiReportWidget.tsx` & `frontend/src/store/useAiReportStore.ts`) (+4 more)

### Community 45 - "AgencyOS - Enterprise Digital Agency Social Management Platform"
Cohesion: 0.20
Nodes (9): 1. Run Backend (FastAPI), 2. Run Frontend (Next.js 15), AgencyOS - Enterprise Digital Agency Social Management Platform, Backend, Default Configured Credentials, Frontend, Getting Started, Key Features MVP 1.0 (+1 more)

### Community 49 - "kol.py"
Cohesion: 0.08
Nodes (62): add_kol_to_campaign(), create_campaign(), create_deliverable(), create_kol_profile(), delete_campaign(), delete_deliverable(), delete_kol_profile(), get_campaign_detail() (+54 more)

### Community 51 - "auth.py"
Cohesion: 0.12
Nodes (29): extract_followers_count(), _get_user_target_workspace(), instagram_challenge_resolve(), instagram_connect(), instagram_cookie_login(), instagram_credential_login(), meta_callback(), meta_connect() (+21 more)

### Community 54 - "useAuthStore"
Cohesion: 0.09
Nodes (31): jsonLd, metadata, LoginPage(), SubscriptionGuard(), TIER_META, PUBLIC_SPLASH_PATHS, SplashScreen(), AppLayout() (+23 more)

### Community 56 - "WorkspaceMember"
Cohesion: 0.15
Nodes (34): AgentRunStatus, str, Client, RoleEnum, Workspace, WorkspaceMember, AgentCreateRequest, AgentUpdateRequest (+26 more)

### Community 58 - "KolDatabaseDrawer.tsx"
Cohesion: 0.16
Nodes (14): GlassToastManager(), Portal(), formatNumberToRupiahString(), getTerbilangShort(), parseRupiahStringToNumber(), RupiahInput(), RupiahInputProps, KolAddEditModal() (+6 more)

### Community 63 - "QueueService"
Cohesion: 0.21
Nodes (10): Any, Session, QueueService, Queue Engine menggunakan background tasks FastAPI. Mengelola publish job per…, Creates PublishJob records and executes them immediately., Sinkronisasi hasil publish dari PostForMe untuk satu target. Mengambil data…, Kurangi 1 kredit dari user yang membuat post setelah PostForMe konfirmasi…, Sinkronisasi manual komprehensif: Ambil 100 hasil publikasi terbaru dari… (+2 more)

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 71 - "get_activity_logs"
Cohesion: 0.24
Nodes (11): clear_all_activity_logs(), delete_activity_log(), get_activity_logs(), delete, get, Session, Ensures that a workspace maintains at most `max_logs` activity log records.…, Retrieves chronological activity audit logs with server-side pagination.… (+3 more)

### Community 75 - "kol-campaigns/page.tsx"
Cohesion: 0.21
Nodes (11): KolCampaignsPage(), CampaignCard(), CampaignCardProps, CampaignItem, STATUS_BADGES, CampaignCreateModal(), CampaignCreateModalProps, AccountItem (+3 more)

### Community 77 - "StorageService"
Cohesion: 0.22
Nodes (7): Any, Deletes a single file object permanently from Backblaze B2 bucket, including…, Permanently deletes multiple file objects and all their versions/delete markers…, Uploads file content to Backblaze B2 under…, Backblaze B2 S3 Compatible Object Storage Service. Strictly isolated under root…, Lists ONLY objects strictly starting with 'AgencyOS/' prefix from Backblaze B2…, StorageService

### Community 78 - "config.py"
Cohesion: 0.17
Nodes (8): Settings, get_me(), get, Returns current authenticated user info from Authorization header., Any, Firebase ID Token Verification Service Uses Google's public keys to verify…, Verifies a Firebase ID token by calling Google Identity Toolkit API. Returns…, verify_firebase_token()

### Community 79 - "accounts/page.tsx"
Cohesion: 0.10
Nodes (27): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), PaginatedActivityResponse, ClientsPage(), MediaPage(), OnboardingPage() (+19 more)

### Community 80 - "idempotency_service.py"
Cohesion: 0.24
Nodes (10): acquire_lock(), cleanup_expired_keys(), is_request_processed(), mark_request_processed(), Periodically cleans up expired keys from memory., Attempts to acquire an in-memory lock for key. Returns True if lock acquired,…, Releases an in-memory lock for key., Checks if a request key was already processed. (+2 more)

### Community 81 - "AppTour.tsx"
Cohesion: 0.47
Nodes (3): AppTour(), DEFAULT_TOUR_STEPS, TourStep

## Knowledge Gaps
- **304 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+299 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `get_user_workspace`, `models.py`, `Session`, `admin.py`, `posts.py`, `queue.py`, `statistics.py`, `kol.py`, `sanitize_text`, `auth.py`, `billing.py`, `WorkspaceMember`, `QueueService`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `queue.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Setting` connect `admin.py` to `models.py`, `auth.py`, `InstagrapiService`, `GeminiService`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `WorkspaceMember` (e.g. with `AssignPlanByEmailRequest` and `PlanUpdateRequest`) actually correct?**
  _`WorkspaceMember` has 29 INFERRED edges - model-reasoned connections that need verification._