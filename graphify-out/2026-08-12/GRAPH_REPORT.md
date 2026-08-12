# Graph Report - agencyOS  (2026-08-12)

## Corpus Check
- 146 files · ~775,257 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1498 nodes · 3432 edges · 80 communities (58 shown, 22 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 421 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `660bb4b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/page.tsx
- calendar/page.tsx
- models.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- database.py
- media.py
- User
- posts.py
- ShieraAiReportWidget.tsx
- main.py
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- react
- sanitize_text
- fetchApi
- InstagrapiService
- billing.py
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- AuthProvider.tsx
- pricing/page.tsx
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
- postforme_webhook
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- migrate_account_briefing.py
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- kol.py
- queue.py
- ActivityLog
- next.config.js
- next-env.d.ts
- useAuthStore
- date-fns
- workspaces.py
- instagrapi_service.py
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
- migrate_db.py
- migrate_kol.py
- tailwind-merge
- migrate_publish_results.py
- migrate_wa_otp.py
- useStore
- idempotency_service.py
- html2canvas

## God Nodes (most connected - your core abstractions)
1. `User` - 151 edges
2. `fetchApi()` - 65 edges
3. `ActivityLog` - 57 edges
4. `SocialAccount` - 53 edges
5. `useStore` - 46 edges
6. `WorkspaceMember` - 44 edges
7. `get_user_workspace()` - 43 edges
8. `Workspace` - 39 edges
9. `UserSubscription` - 31 edges
10. `useAuthStore` - 31 edges

## Surprising Connections (you probably didn't know these)
- `AssignPlanByEmailRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `PlanUpdateRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `SettingUpsertRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `SubscriptionOverrideRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `UserSubscriptionUpdatePayload` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (80 total, 22 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "calendar/page.tsx"
Cohesion: 0.40
Nodes (5): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS

### Community 2 - "models.py"
Cohesion: 0.44
Nodes (25): AccountPlatform, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType, KolPaymentStatus (+17 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.09
Nodes (26): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+18 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "database.py"
Cohesion: 0.09
Nodes (20): Settings, get_db(), Reset Subscriptions Script — Clears all user subscriptions in DB. Run: python…, ClientCreate, create_client(), BaseModel, post, Creates a new client under a workspace owned by the current user. (+12 more)

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (36): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+28 more)

### Community 8 - "User"
Cohesion: 0.10
Nodes (55): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., Setting, SubscriptionPlan, SubscriptionStatus, User (+47 more)

### Community 9 - "posts.py"
Cohesion: 0.26
Nodes (21): Post, PostStatus, PostTarget, PostType, create_post(), GenerateAICaptionRequest, patch_post(), PostCreate (+13 more)

### Community 10 - "ShieraAiReportWidget.tsx"
Cohesion: 0.11
Nodes (15): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+7 more)

### Community 11 - "main.py"
Cohesion: 0.13
Nodes (16): get, root(), Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, AgentRunStatus, Base, str (+8 more)

### Community 12 - "statistics.py"
Cohesion: 0.08
Nodes (45): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, put (+37 more)

### Community 13 - "agent_scheduler.py"
Cohesion: 0.07
Nodes (34): InMemoryRateLimiter, Request, SecurityMiddleware, add_agent(), _build_cron_days(), get_next_run(), _load_all_active_agents(), datetime (+26 more)

### Community 14 - ".apply_watermark"
Cohesion: 0.20
Nodes (8): Any, Watermark Service — High Performance Image Watermarking Engine for agencyOS…, Returns base64 data URI string of watermarked image for frontend live preview., Calculates top-left (X, Y) coordinate for watermark placement based on 9-point…, Download remote logo image via httpx., Applies a watermark (Text or Image Logo) onto the base image. Config schema: {…, WatermarkService, Image

### Community 15 - "GeminiService"
Cohesion: 0.11
Nodes (23): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+15 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 18 - "sanitize_text"
Cohesion: 0.14
Nodes (19): approve_public_post_review(), create_media_upload_url(), delete_post(), generate_ai_caption(), get_posts(), get_public_post_review(), delete, get (+11 more)

### Community 19 - "fetchApi"
Cohesion: 0.08
Nodes (37): CampaignDetailPage(), DELIVERABLE_STATUS_COLORS, PAYMENT_STATUS_BADGES, KolCampaignsPage(), PublicClientReviewPage(), ReviewPostData, TargetAccount, Portal() (+29 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.08
Nodes (26): InstagrapiService, Any, Session, Fetch configured Residential Proxy setting from DB or parameters., Test proxy connectivity by querying public IP checkers., Create an instagrapi Client preconfigured with Proxy, Bandwidth Optimizations &…, Connects to IMAP mail server (e.g. Gmail) to automatically search and extract…, Handler called by instagrapi when Instagram forces a password change during… (+18 more)

### Community 21 - "billing.py"
Cohesion: 0.12
Nodes (30): _activate_user_subscription(), create_checkout(), get_frontend_url(), get_subscription(), _get_user_from_auth(), list_plans(), midtrans_notification(), get (+22 more)

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
Nodes (15): clsx, dependencies, clsx, jspdf, lucide-react, react-dom, react-is, recharts (+7 more)

### Community 27 - "AuthProvider.tsx"
Cohesion: 0.21
Nodes (9): jsonLd, metadata, AuthProvider(), Providers(), getIdToken(), onAuthChange(), auth, firebaseConfig (+1 more)

### Community 28 - "pricing/page.tsx"
Cohesion: 0.24
Nodes (8): DEFAULT_PLANS, PricingPage(), TIER_ORDER, TIER_UI_META, Window, Step, WaVerifyModal(), WaVerifyModalProps

### Community 29 - "queue/page.tsx"
Cohesion: 0.11
Nodes (22): isDatePast(), LocalPost, LocalPostStatus, PfPost, PfResult, PLATFORM_COLORS, PLATFORM_ICONS, QueuePage() (+14 more)

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
Nodes (57): bulk_action(), get_account_briefing(), get_account_watermark(), get_accounts(), delete, get, post, put (+49 more)

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

### Community 40 - "postforme_webhook"
Cohesion: 0.16
Nodes (14): list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post, Request, Menerima event dari PostForMe API. PostForMe mengirim POST request dengan: -… (+6 more)

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

### Community 50 - "queue.py"
Cohesion: 0.38
Nodes (4): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, PublishJob, Webhook handler untuk menerima event dari PostForMe API. PostForMe mengirim…

### Community 51 - "ActivityLog"
Cohesion: 0.10
Nodes (56): AccountStatus, ActivityLog, Client, RoleEnum, SocialAccount, AccountBriefingSchema, BulkActionRequest, delete_account() (+48 more)

### Community 54 - "useAuthStore"
Cohesion: 0.07
Nodes (37): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, OAuthCallbackHandler(), BillingSuccessContent(), dynamic, DashboardImageThumbnail() (+29 more)

### Community 56 - "workspaces.py"
Cohesion: 0.23
Nodes (12): create_workspace(), get_workspaces(), OnboardingSetupRequest, BaseModel, get, post, Session, Onboarding endpoint — creates the first workspace for a new user. Validates… (+4 more)

### Community 63 - "QueueService"
Cohesion: 0.20
Nodes (12): PostPublishResult, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, Any, Session, QueueService, Queue Engine menggunakan background tasks FastAPI. Mengelola publish job per…, Creates PublishJob records and executes them immediately., Sinkronisasi hasil publish dari PostForMe untuk satu target. Mengambil data… (+4 more)

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 71 - "get_activity_logs"
Cohesion: 0.24
Nodes (11): clear_all_activity_logs(), delete_activity_log(), get_activity_logs(), delete, get, Session, Ensures that a workspace maintains at most `max_logs` activity log records.…, Retrieves chronological activity audit logs with server-side pagination.… (+3 more)

### Community 79 - "useStore"
Cohesion: 0.10
Nodes (31): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), PaginatedActivityResponse, ClientsPage(), MediaPage(), OnboardingPage() (+23 more)

### Community 80 - "idempotency_service.py"
Cohesion: 0.24
Nodes (10): acquire_lock(), cleanup_expired_keys(), is_request_processed(), mark_request_processed(), Periodically cleans up expired keys from memory., Attempts to acquire an in-memory lock for key. Returns True if lock acquired,…, Releases an in-memory lock for key., Checks if a request key was already processed. (+2 more)

## Knowledge Gaps
- **308 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+303 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `get_user_workspace`, `models.py`, `Session`, `database.py`, `posts.py`, `main.py`, `statistics.py`, `kol.py`, `sanitize_text`, `ActivityLog`, `queue.py`, `billing.py`, `workspaces.py`, `QueueService`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `queue.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Setting` connect `User` to `instagrapi_service.py`, `models.py`, `InstagrapiService`, `GeminiService`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 33 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `nextConfig`, `name` to the rest of the system?**
  _308 weakly-connected nodes found - possible documentation gaps or missing edges._