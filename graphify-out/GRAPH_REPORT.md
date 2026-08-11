# Graph Report - agencyOS  (2026-08-11)

## Corpus Check
- 148 files · ~778,467 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1523 nodes · 3591 edges · 86 communities (62 shown, 24 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 449 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ed4bc2b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/page.tsx
- useStore
- models.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- admin.py
- ActivityLog
- competitor-spy/page.tsx
- User
- kol.py
- redis_service.py
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- Session
- Session
- fetchApi
- InstagrapiService
- SocialAccount
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- migrate_competitor_accounts.py
- PostComposerModal.tsx
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
- WorkspaceMember
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- AccountPlatform
- migrate_db.py
- main.py
- next.config.js
- next-env.d.ts
- useAuthStore
- agent_service.py
- migrate_kol.py
- firebase_auth.py
- delete_agent
- SecurityMiddleware
- migrate_account_briefing.py
- Token-efficient agent
- date-fns
- firebase
- rules/token-efficient.md
- competitors.py
- workflows/token-efficient.md
- QueueService
- html2canvas
- next
- migrate_kol_stats.py
- migrate_post_ai_brief.py
- tailwind-merge
- migrate_publish_results.py
- zustand
- accounts/page.tsx
- pricing/page.tsx
- migrate_wa_otp.py
- StorageService
- react
- clients.py
- reset_competitor_data.py

## God Nodes (most connected - your core abstractions)
1. `User` - 169 edges
2. `fetchApi()` - 69 edges
3. `ActivityLog` - 61 edges
4. `SocialAccount` - 57 edges
5. `useStore` - 46 edges
6. `WorkspaceMember` - 45 edges
7. `Workspace` - 44 edges
8. `get_user_workspace()` - 43 edges
9. `AccountPlatform` - 33 edges
10. `UserSubscription` - 32 edges

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

## Communities (86 total, 24 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "useStore"
Cohesion: 0.13
Nodes (15): OAuthCallbackHandler(), CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, DashboardImageThumbnail(), DashboardPage() (+7 more)

### Community 2 - "models.py"
Cohesion: 0.18
Nodes (13): get_db(), Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Post, PostStatus, PostTarget, PublishJob, Reset Subscriptions Script — Clears all user subscriptions in DB. Run: python… (+5 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.06
Nodes (39): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+31 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "admin.py"
Cohesion: 0.06
Nodes (90): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., RoleEnum, Setting, SubscriptionPlan, SubscriptionStatus (+82 more)

### Community 7 - "ActivityLog"
Cohesion: 0.15
Nodes (27): ActivityLog, Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media() (+19 more)

### Community 8 - "competitor-spy/page.tsx"
Cohesion: 0.17
Nodes (12): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, CompetitorProgressWidget() (+4 more)

### Community 9 - "User"
Cohesion: 0.12
Nodes (40): AccountStatus, User, AccountBriefingSchema, bulk_action(), BulkActionRequest, delete_account(), get_account_briefing(), get_account_watermark() (+32 more)

### Community 10 - "kol.py"
Cohesion: 0.14
Nodes (39): add_kol_to_campaign(), create_campaign(), create_deliverable(), create_kol_profile(), delete_campaign(), delete_deliverable(), delete_kol_profile(), get_campaign_detail() (+31 more)

### Community 11 - "redis_service.py"
Cohesion: 0.12
Nodes (26): BackgroundTasks, Background task: runs all brand syncs concurrently for selected IG account., Non-blocking: Trigger parallel background refresh of competitors for selected…, _run_sync_all_bg(), sync_all_competitors(), cache_get(), check_rate_limit(), _get_redis() (+18 more)

### Community 12 - "statistics.py"
Cohesion: 0.08
Nodes (42): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, Session (+34 more)

### Community 13 - "agent_scheduler.py"
Cohesion: 0.13
Nodes (21): add_agent(), _build_cron_days(), get_next_run(), _load_all_active_agents(), datetime, Agent Scheduler — APScheduler wrapper for Shiera AI Agent system.…, Add or replace a cron job for an agent. No-op on serverless., Public API: schedule a new agent or update existing. (+13 more)

### Community 14 - ".apply_watermark"
Cohesion: 0.20
Nodes (8): Any, Watermark Service — High Performance Image Watermarking Engine for agencyOS…, Returns base64 data URI string of watermarked image for frontend live preview., Calculates top-left (X, Y) coordinate for watermark placement based on 9-point…, Download remote logo image via httpx., Applies a watermark (Text or Image Logo) onto the base image. Config schema: {…, WatermarkService, Image

### Community 15 - "GeminiService"
Cohesion: 0.11
Nodes (23): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+15 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 17 - "Session"
Cohesion: 0.11
Nodes (26): AgentConfig, AgentRunLog, create_agent(), cron_trigger(), delete_agent_log(), get_agent(), get_agent_logs(), list_agents() (+18 more)

### Community 18 - "Session"
Cohesion: 0.13
Nodes (19): delete_queue_job(), _fallback_local_results(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks, delete, get (+11 more)

### Community 19 - "fetchApi"
Cohesion: 0.08
Nodes (36): CampaignDetailPage(), DELIVERABLE_STATUS_COLORS, PAYMENT_STATUS_BADGES, KolCampaignsPage(), PublicClientReviewPage(), ReviewPostData, TargetAccount, formatNumberToRupiahString() (+28 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.10
Nodes (21): InstagrapiService, Any, Session, Handler called by instagrapi when Instagram forces a password change during…, Handler called by instagrapi when Instagram requires verification code…, Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table., Generates a 6-digit TOTP verification code from 2FA Secret Key., Perform login via username & password using instagrapi Client with Challenge… (+13 more)

### Community 21 - "SocialAccount"
Cohesion: 0.13
Nodes (38): SocialAccount, BlueskyConnectRequest, ChallengeResolveRequest, CookieLoginRequest, CredentialLoginRequest, extract_followers_count(), _get_user_target_workspace(), instagram_challenge_resolve() (+30 more)

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

### Community 28 - "PostComposerModal.tsx"
Cohesion: 0.27
Nodes (5): GlassToastManager(), Portal(), PLATFORM_BADGES, PostComposerModal(), useToastStore

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

### Community 33 - "agents.py"
Cohesion: 0.18
Nodes (16): Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, AgentRunStatus, Base, str, Agent Models — Shiera AI Agent System Stores agent configurations and run…, Konfigurasi satu AI Agent per workspace. Satu agent = 1 jadwal otomatis yang… (+8 more)

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
Nodes (34): PostType, approve_public_post_review(), create_media_upload_url(), create_post(), delete_post(), generate_ai_caption(), GenerateAICaptionRequest, get_posts() (+26 more)

### Community 41 - "AgencyOS Backend Documentation"
Cohesion: 0.11
Nodes (17): AgencyOS Backend Documentation, **Atau Jika Berada di Dalam Folder `backend` (dengan venv aktif):**, **Dari Folder Root `agencyOS`:**, **Di Linux / macOS:**, **Di Windows (Command Prompt / CMD):**, **Di Windows (PowerShell):**, 🛠️ Langkah 1: Pindah ke Direktori Backend, 🐍 Langkah 2: Membuat Virtual Environment (`venv`) (+9 more)

### Community 42 - "🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)"
Cohesion: 0.13
Nodes (14): 📊 1. Matriks Kapasitas Infrastruktur, 🏗️ 2. Roadmap Upscaling Bertahap, 🛠️ 3. Langkah Implementasi Upscaling, 🧪 4. Load Testing & Benchmark Scripts, 📈 5. Monitoring & Alerting Checklist, A. Install Dependencies, 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`), B. Konfigurasi Redis Queue (`backend/services/redis_queue.py`) (+6 more)

### Community 43 - "WorkspaceMember"
Cohesion: 0.27
Nodes (17): Client, Base, Workspace, WorkspaceMember, PostForMeSyncRequest, create_workspace(), get_workspaces(), OnboardingSetupRequest (+9 more)

### Community 44 - "🛠️ 2. Komponen Teknis Terimplementasi"
Cohesion: 0.15
Nodes (12): 🚀 1. Overview & Arsitektur Sistem, 🛠️ 2. Komponen Teknis Terimplementasi, 🔮 3. Roadmap Optimalisasi Skala Besar (Production Scale), 📌 4. Ringkasan File Terkait, A. Dual Engine, Fallback & Automated WhatsApp Alert System (`backend/services/gemini_service.py` & `backend/services/fonnte_service.py`), B. Admin Control Panel Configuration (`backend/routers/admin.py` & `frontend/src/app/admin/page.tsx`), C. Clean Markdown Renderer (`frontend/src/components/common/ShieraMarkdownViewer.tsx`), D. Global Chat Drawer & Floating Minimize Widget (`frontend/src/components/common/ShieraAiReportWidget.tsx` & `frontend/src/store/useAiReportStore.ts`) (+4 more)

### Community 45 - "AgencyOS - Enterprise Digital Agency Social Management Platform"
Cohesion: 0.20
Nodes (9): 1. Run Backend (FastAPI), 2. Run Frontend (Next.js 15), AgencyOS - Enterprise Digital Agency Social Management Platform, Backend, Default Configured Credentials, Frontend, Getting Started, Key Features MVP 1.0 (+1 more)

### Community 49 - "AccountPlatform"
Cohesion: 0.50
Nodes (22): AccountPlatform, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType, KolPaymentStatus (+14 more)

### Community 54 - "useAuthStore"
Cohesion: 0.07
Nodes (37): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, jsonLd, metadata (+29 more)

### Community 55 - "agent_service.py"
Cohesion: 0.29
Nodes (5): _extract_composer_payload(), _get_agent_lock(), Agent Service — Core AI Agent Runner Mengeksekusi satu AgentConfig: ambil akun…, Extract ```json ... ``` composer_payload block from AI output., Lock

### Community 57 - "firebase_auth.py"
Cohesion: 0.18
Nodes (10): Settings, get_current_user_from_token(), Session, Firebase Auth Router — /auth/firebase Verifies Google Firebase ID Token and…, Dependency: extracts Firebase token from Authorization header and returns DB…, Dependency: requires admin user., Dependency: requires authenticated user., require_admin() (+2 more)

### Community 58 - "delete_agent"
Cohesion: 0.67
Nodes (3): delete_agent(), delete, Delete an agent and all its run logs.

### Community 62 - "SecurityMiddleware"
Cohesion: 0.33
Nodes (4): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 68 - "competitors.py"
Cohesion: 0.11
Nodes (45): CompetitorAccount, CompetitorPost, add_competitor(), AddCompetitorRequest, CompetitorResponse, delete_competitor(), get_add_competitor_status(), get_benchmark_matrix() (+37 more)

### Community 71 - "QueueService"
Cohesion: 0.09
Nodes (26): PostPublishResult, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post (+18 more)

### Community 79 - "accounts/page.tsx"
Cohesion: 0.10
Nodes (26): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), MediaPage(), OnboardingPage(), AccountBriefingModal() (+18 more)

### Community 80 - "pricing/page.tsx"
Cohesion: 0.24
Nodes (8): DEFAULT_PLANS, PricingPage(), TIER_ORDER, TIER_UI_META, Window, Step, WaVerifyModal(), WaVerifyModalProps

### Community 82 - "StorageService"
Cohesion: 0.22
Nodes (7): Any, Deletes a single file object permanently from Backblaze B2 bucket, including…, Permanently deletes multiple file objects and all their versions/delete markers…, Uploads file content to Backblaze B2 under…, Backblaze B2 S3 Compatible Object Storage Service. Strictly isolated under root…, Lists ONLY objects strictly starting with 'AgencyOS/' prefix from Backblaze B2…, StorageService

### Community 84 - "clients.py"
Cohesion: 0.21
Nodes (11): ClientCreate, create_client(), delete_client(), get_clients(), BaseModel, delete, get, post (+3 more)

## Knowledge Gaps
- **312 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `agents.py`, `models.py`, `competitors.py`, `admin.py`, `QueueService`, `posts.py`, `kol.py`, `WorkspaceMember`, `statistics.py`, `redis_service.py`, `Session`, `AccountPlatform`, `Session`, `clients.py`, `SocialAccount`, `firebase_auth.py`, `delete_agent`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `models.py`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `ActivityLog` connect `ActivityLog` to `models.py`, `competitors.py`, `posts.py`, `User`, `kol.py`, `WorkspaceMember`, `AccountPlatform`, `SocialAccount`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 51 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 51 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 36 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `nextConfig`, `name` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._