# Graph Report - agencyOS  (2026-08-05)

## Corpus Check
- 148 files · ~771,102 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1503 nodes · 3501 edges · 78 communities (61 shown, 17 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 426 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a606241`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/page.tsx
- accounts/page.tsx
- models.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- admin.py
- Session
- competitor-spy/page.tsx
- PostComposerModal.tsx
- useStore
- useAuthStore
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- create_agent
- Session
- fetchApi
- InstagrapiService
- auth.py
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- get_user_workspace
- ShieraAiReportWidget.tsx
- queue/page.tsx
- YTPlayer
- Components
- MetaAdapter
- agents.py
- 3. Routers & Endpoints (Backend)
- clear_all_activity_logs
- app/page.tsx
- package.json
- services
- server.js
- posts.py
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- SocialAccount
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- create_client
- StorageService
- main.py
- next.config.js
- next-env.d.ts
- ActivityLog
- agent_service.py
- QueueService
- pricing/page.tsx
- delete_agent
- SecurityMiddleware
- _serialize_log
- Token-efficient agent
- get_current_user_from_token
- rules/token-efficient.md
- User
- workflows/token-efficient.md
- migrate_account_briefing.py
- migrate_kol_stats.py
- migrate_competitor_accounts.py
- migrate_db.py
- migrate_kol.py
- migrate_post_ai_brief.py
- migrate_publish_results.py
- migrate_wa_otp.py

## God Nodes (most connected - your core abstractions)
1. `User` - 161 edges
2. `fetchApi()` - 69 edges
3. `ActivityLog` - 60 edges
4. `SocialAccount` - 56 edges
5. `useStore` - 46 edges
6. `WorkspaceMember` - 44 edges
7. `Workspace` - 43 edges
8. `get_user_workspace()` - 41 edges
9. `AccountPlatform` - 33 edges
10. `useAuthStore` - 31 edges

## Surprising Connections (you probably didn't know these)
- `BlueskyConnectRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py
- `ChallengeResolveRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py
- `CookieLoginRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py
- `CredentialLoginRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py
- `PostForMeAuthUrlRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (78 total, 17 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (18): AgentPage(), DAY_LABELS, formatDateTime(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal(), CONTENT_FORMATS (+10 more)

### Community 1 - "accounts/page.tsx"
Cohesion: 0.11
Nodes (22): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), OnboardingPage(), AccountBriefingModal(), AccountBriefingModalProps (+14 more)

### Community 2 - "models.py"
Cohesion: 0.20
Nodes (15): Settings, get_db(), Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Post, PostStatus, PostTarget, PublishJob (+7 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.11
Nodes (21): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+13 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "admin.py"
Cohesion: 0.06
Nodes (82): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., RoleEnum, Setting, SubscriptionPlan, SubscriptionStatus (+74 more)

### Community 7 - "Session"
Cohesion: 0.15
Nodes (19): bulk_delete_media(), bulk_move_media(), delete_media(), get_media_items(), delete, get, post, Session (+11 more)

### Community 8 - "competitor-spy/page.tsx"
Cohesion: 0.17
Nodes (12): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, CompetitorProgressWidget() (+4 more)

### Community 9 - "PostComposerModal.tsx"
Cohesion: 0.11
Nodes (17): GlassToastManager(), Portal(), formatNumberToRupiahString(), getTerbilangShort(), parseRupiahStringToNumber(), RupiahInput(), RupiahInputProps, ShieraMarkdownViewer() (+9 more)

### Community 10 - "useStore"
Cohesion: 0.11
Nodes (19): OAuthCallbackHandler(), CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, DashboardImageThumbnail(), DashboardPage() (+11 more)

### Community 11 - "useAuthStore"
Cohesion: 0.09
Nodes (31): jsonLd, metadata, LoginPage(), SubscriptionGuard(), TIER_META, PUBLIC_SPLASH_PATHS, SplashScreen(), AppLayout() (+23 more)

### Community 12 - "statistics.py"
Cohesion: 0.07
Nodes (49): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, put (+41 more)

### Community 13 - "agent_scheduler.py"
Cohesion: 0.13
Nodes (20): add_agent(), _build_cron_days(), get_next_run(), _load_all_active_agents(), datetime, Agent Scheduler — APScheduler wrapper for Shiera AI Agent system. Uses…, Public API: schedule a new agent or update existing., Public API: remove agent's scheduled job. (+12 more)

### Community 14 - ".apply_watermark"
Cohesion: 0.20
Nodes (8): Any, Watermark Service — High Performance Image Watermarking Engine for agencyOS…, Returns base64 data URI string of watermarked image for frontend live preview., Calculates top-left (X, Y) coordinate for watermark placement based on 9-point…, Download remote logo image via httpx., Applies a watermark (Text or Image Logo) onto the base image. Config schema: {…, WatermarkService, Image

### Community 15 - "GeminiService"
Cohesion: 0.12
Nodes (19): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 17 - "create_agent"
Cohesion: 0.15
Nodes (20): create_agent(), get_agent(), get_agent_logs(), list_agents(), AgentConfig, BackgroundTasks, get, patch (+12 more)

### Community 18 - "Session"
Cohesion: 0.12
Nodes (21): delete_queue_job(), _fallback_local_results(), get_postforme_posts(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks, delete (+13 more)

### Community 19 - "fetchApi"
Cohesion: 0.08
Nodes (32): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, CampaignDetailPage(), DELIVERABLE_STATUS_COLORS (+24 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.10
Nodes (21): InstagrapiService, Any, Session, Handler called by instagrapi when Instagram forces a password change during…, Handler called by instagrapi when Instagram requires verification code…, Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table., Generates a 6-digit TOTP verification code from 2FA Secret Key., Perform login via username & password using instagrapi Client with Challenge… (+13 more)

### Community 21 - "auth.py"
Cohesion: 0.14
Nodes (28): extract_followers_count(), _get_user_target_workspace(), instagram_challenge_resolve(), instagram_connect(), instagram_cookie_login(), instagram_credential_login(), meta_callback(), meta_connect() (+20 more)

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
Cohesion: 0.07
Nodes (29): clsx, date-fns, firebase, dependencies, clsx, date-fns, firebase, html2canvas (+21 more)

### Community 27 - "get_user_workspace"
Cohesion: 0.16
Nodes (28): AccountStatus, AccountBriefingSchema, bulk_action(), BulkActionRequest, delete_account(), get_account_briefing(), get_account_watermark(), get_accounts() (+20 more)

### Community 28 - "ShieraAiReportWidget.tsx"
Cohesion: 0.14
Nodes (16): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+8 more)

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
Cohesion: 0.14
Nodes (7): MetaAdapter, Any, Adapter for Meta Graph API (Instagram Business API & Facebook Page API).…, Publishes post to Instagram Business via Graph API container flow., Publishes post to Facebook Page via Graph API., Exchanges OAuth auth code for short-lived access token, then long-lived access…, Fetches connected Facebook Pages and associated Instagram Business Accounts.

### Community 33 - "agents.py"
Cohesion: 0.20
Nodes (13): Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, AgentRunStatus, Base, str, Agent Models — Shiera AI Agent System Stores agent configurations and run…, Konfigurasi satu AI Agent per workspace. Satu agent = 1 jadwal otomatis yang… (+5 more)

### Community 34 - "3. Routers & Endpoints (Backend)"
Cohesion: 0.09
Nodes (22): 1. Configuration & Models (Backend), 2. PostForMe Service & Queue Engine (Backend), 3. Routers & Endpoints (Backend), 4. Frontend UI Rework, Automated Tests, Implementation Plan - PostForMe API Integration & Full Platform Overhaul, Manual Verification, [MODIFY] [accounts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/accounts.py) (+14 more)

### Community 35 - "clear_all_activity_logs"
Cohesion: 0.25
Nodes (9): clear_all_activity_logs(), delete_activity_log(), get_activity_logs(), delete, get, Session, Retrieves chronological activity audit logs., Deletes a specific activity log entry. (+1 more)

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

### Community 40 - "posts.py"
Cohesion: 0.12
Nodes (34): PostType, approve_public_post_review(), create_media_upload_url(), create_post(), delete_post(), get_posts(), get_public_post_review(), patch_post() (+26 more)

### Community 41 - "AgencyOS Backend Documentation"
Cohesion: 0.11
Nodes (17): AgencyOS Backend Documentation, **Atau Jika Berada di Dalam Folder `backend` (dengan venv aktif):**, **Dari Folder Root `agencyOS`:**, **Di Linux / macOS:**, **Di Windows (Command Prompt / CMD):**, **Di Windows (PowerShell):**, 🛠️ Langkah 1: Pindah ke Direktori Backend, 🐍 Langkah 2: Membuat Virtual Environment (`venv`) (+9 more)

### Community 42 - "🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)"
Cohesion: 0.13
Nodes (14): 📊 1. Matriks Kapasitas Infrastruktur, 🏗️ 2. Roadmap Upscaling Bertahap, 🛠️ 3. Langkah Implementasi Upscaling, 🧪 4. Load Testing & Benchmark Scripts, 📈 5. Monitoring & Alerting Checklist, A. Install Dependencies, 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`), B. Konfigurasi Redis Queue (`backend/services/redis_queue.py`) (+6 more)

### Community 43 - "SocialAccount"
Cohesion: 0.19
Nodes (32): AccountPlatform, Client, CompetitorAccount, CompetitorPost, Base, SocialAccount, Workspace, WorkspaceMember (+24 more)

### Community 44 - "🛠️ 2. Komponen Teknis Terimplementasi"
Cohesion: 0.15
Nodes (12): 🚀 1. Overview & Arsitektur Sistem, 🛠️ 2. Komponen Teknis Terimplementasi, 🔮 3. Roadmap Optimalisasi Skala Besar (Production Scale), 📌 4. Ringkasan File Terkait, A. Dual Engine, Fallback & Automated WhatsApp Alert System (`backend/services/gemini_service.py` & `backend/services/fonnte_service.py`), B. Admin Control Panel Configuration (`backend/routers/admin.py` & `frontend/src/app/admin/page.tsx`), C. Clean Markdown Renderer (`frontend/src/components/common/ShieraMarkdownViewer.tsx`), D. Global Chat Drawer & Floating Minimize Widget (`frontend/src/components/common/ShieraAiReportWidget.tsx` & `frontend/src/store/useAiReportStore.ts`) (+4 more)

### Community 45 - "AgencyOS - Enterprise Digital Agency Social Management Platform"
Cohesion: 0.20
Nodes (9): 1. Run Backend (FastAPI), 2. Run Frontend (Next.js 15), AgencyOS - Enterprise Digital Agency Social Management Platform, Backend, Default Configured Credentials, Frontend, Getting Started, Key Features MVP 1.0 (+1 more)

### Community 49 - "create_client"
Cohesion: 0.18
Nodes (11): ClientCreate, create_client(), delete_client(), get_clients(), BaseModel, delete, get, post (+3 more)

### Community 50 - "StorageService"
Cohesion: 0.22
Nodes (7): Any, Deletes a single file object permanently from Backblaze B2 bucket, including…, Permanently deletes multiple file objects and all their versions/delete markers…, Uploads file content to Backblaze B2 under…, Backblaze B2 S3 Compatible Object Storage Service. Strictly isolated under root…, Lists ONLY objects strictly starting with 'AgencyOS/' prefix from Backblaze B2…, StorageService

### Community 54 - "ActivityLog"
Cohesion: 0.40
Nodes (8): ActivityLog, Media, BulkDeleteRequest, BulkMoveRequest, delete_folder(), MediaUpdate, BaseModel, Deletes a folder and all media items inside it from Backblaze B2 storage and…

### Community 55 - "agent_service.py"
Cohesion: 0.27
Nodes (9): _extract_composer_payload(), _fail_run(), AgentConfig, AgentRunLog, Session, Agent Service — Core AI Agent Runner Mengeksekusi satu AgentConfig: ambil akun…, Extract ```json ... ``` composer_payload block from AI output., Core agent runner. Returns summary dict. Called by scheduler… (+1 more)

### Community 56 - "QueueService"
Cohesion: 0.09
Nodes (26): PostPublishResult, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post (+18 more)

### Community 57 - "pricing/page.tsx"
Cohesion: 0.24
Nodes (8): DEFAULT_PLANS, PricingPage(), TIER_ORDER, TIER_UI_META, Window, Step, WaVerifyModal(), WaVerifyModalProps

### Community 58 - "delete_agent"
Cohesion: 0.67
Nodes (3): delete_agent(), delete, Delete an agent and all its run logs.

### Community 62 - "SecurityMiddleware"
Cohesion: 0.29
Nodes (4): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 65 - "get_current_user_from_token"
Cohesion: 0.29
Nodes (8): get_current_user_from_token(), get_me(), get, Session, Returns current authenticated user info from Authorization header., Dependency: extracts Firebase token from Authorization header and returns DB…, Dependency: requires admin user., require_admin()

### Community 68 - "User"
Cohesion: 0.05
Nodes (132): KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType, KolPaymentStatus, KolProfile (+124 more)

## Knowledge Gaps
- **312 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `agents.py`, `models.py`, `get_current_user_from_token`, `admin.py`, `posts.py`, `SocialAccount`, `statistics.py`, `create_agent`, `create_client`, `Session`, `auth.py`, `QueueService`, `delete_agent`, `get_user_workspace`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `models.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `ActivityLog` connect `ActivityLog` to `models.py`, `User`, `Session`, `posts.py`, `SocialAccount`, `statistics.py`, `auth.py`, `get_user_workspace`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 48 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 32 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 35 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 35 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `nextConfig`, `name` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._