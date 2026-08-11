# Graph Report - agencyOS  (2026-08-11)

## Corpus Check
- 148 files · ~778,787 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1525 nodes · 3604 edges · 82 communities (59 shown, 23 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 455 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f097ecd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/page.tsx
- useStore.ts
- models.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- admin.py
- media.py
- competitor-spy/page.tsx
- billing.py
- User
- kol-campaigns/page.tsx
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- ShieraAiReportWidget.tsx
- Session
- fetchApi
- InstagrapiService
- Session
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- migrate_competitor_accounts.py
- useStore
- queue/page.tsx
- YTPlayer
- Components
- MetaAdapter
- get_user_workspace
- 3. Routers & Endpoints (Backend)
- clear_all_activity_logs
- app/page.tsx
- package.json
- services
- server.js
- posts.py
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- postforme_webhook
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- UserSubscription
- migrate_db.py
- reset_subscriptions.py
- next.config.js
- next-env.d.ts
- Sidebar.tsx
- migrate_kol.py
- firebase_auth.py
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
- migrate_wa_otp.py
- StorageService
- react

## God Nodes (most connected - your core abstractions)
1. `User` - 170 edges
2. `fetchApi()` - 69 edges
3. `ActivityLog` - 61 edges
4. `SocialAccount` - 57 edges
5. `WorkspaceMember` - 49 edges
6. `useStore` - 46 edges
7. `Workspace` - 44 edges
8. `get_user_workspace()` - 43 edges
9. `AccountPlatform` - 33 edges
10. `UserSubscription` - 32 edges

## Surprising Connections (you probably didn't know these)
- `CheckoutRequest` --uses--> `PlanTier`  [INFERRED]
  backend/routers/billing.py → backend/models/models.py
- `OtpSendRequest` --uses--> `PlanTier`  [INFERRED]
  backend/routers/billing.py → backend/models/models.py
- `OtpVerifyRequest` --uses--> `PlanTier`  [INFERRED]
  backend/routers/billing.py → backend/models/models.py
- `SyncCheckoutRequest` --uses--> `PlanTier`  [INFERRED]
  backend/routers/billing.py → backend/models/models.py
- `FirebaseVerifyRequest` --uses--> `PlanTier`  [INFERRED]
  backend/routers/firebase_auth.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (82 total, 23 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "useStore.ts"
Cohesion: 0.15
Nodes (13): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, MediaPage(), MoveToFolderModal(), MoveToFolderModalProps (+5 more)

### Community 2 - "models.py"
Cohesion: 0.25
Nodes (13): get_db(), Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Post, PostStatus, PostTarget, PublishJob, BaseModel (+5 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.09
Nodes (26): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+18 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "admin.py"
Cohesion: 0.26
Nodes (21): PlanTier, RoleEnum, Setting, SubscriptionStatus, AssignPlanByEmailRequest, InstagramTestRequest, override_user_subscription(), PlanUpdateRequest (+13 more)

### Community 7 - "media.py"
Cohesion: 0.14
Nodes (26): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+18 more)

### Community 8 - "competitor-spy/page.tsx"
Cohesion: 0.17
Nodes (12): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, CompetitorProgressWidget() (+4 more)

### Community 9 - "billing.py"
Cohesion: 0.17
Nodes (24): _activate_user_subscription(), create_checkout(), get_frontend_url(), get_subscription(), _get_user_from_auth(), list_plans(), midtrans_notification(), get (+16 more)

### Community 10 - "User"
Cohesion: 0.06
Nodes (147): AccountPlatform, AccountStatus, ActivityLog, Client, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable (+139 more)

### Community 11 - "kol-campaigns/page.tsx"
Cohesion: 0.13
Nodes (15): KolCampaignsPage(), CampaignCard(), CampaignCardProps, CampaignItem, STATUS_BADGES, CampaignCreateModalProps, AccountItem, KolAccountSelector() (+7 more)

### Community 12 - "statistics.py"
Cohesion: 0.07
Nodes (49): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, put (+41 more)

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
Cohesion: 0.15
Nodes (13): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+5 more)

### Community 18 - "Session"
Cohesion: 0.11
Nodes (23): cancel_postforme_post(), delete_queue_job(), _fallback_local_results(), get_postforme_posts(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks (+15 more)

### Community 19 - "fetchApi"
Cohesion: 0.07
Nodes (34): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, CampaignDetailPage(), DELIVERABLE_STATUS_COLORS (+26 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.09
Nodes (22): InstagrapiService, Any, Session, Instagrapi Service — Instagram Private API Integration for Competitor Spy Uses…, Handler called by instagrapi when Instagram forces a password change during…, Handler called by instagrapi when Instagram requires verification code…, Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table., Generates a 6-digit TOTP verification code from 2FA Secret Key. (+14 more)

### Community 21 - "Session"
Cohesion: 0.12
Nodes (22): assign_plan_by_email(), delete_setting(), delete_user(), get_plans(), get_settings(), get_user_stats(), list_users(), delete (+14 more)

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

### Community 28 - "useStore"
Cohesion: 0.15
Nodes (19): OAuthCallbackHandler(), DashboardImageThumbnail(), DashboardPage(), getProxiedImageUrl(), OnboardingPage(), SubscriptionGuard(), TIER_META, UploadProgressWidget() (+11 more)

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

### Community 33 - "get_user_workspace"
Cohesion: 0.05
Nodes (66): AgentConfig, AgentRunLog, get, root(), Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, AgentRunStatus (+58 more)

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

### Community 43 - "postforme_webhook"
Cohesion: 0.16
Nodes (14): list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post, Request, Menerima event dari PostForMe API. PostForMe mengirim POST request dengan: -… (+6 more)

### Community 44 - "🛠️ 2. Komponen Teknis Terimplementasi"
Cohesion: 0.15
Nodes (12): 🚀 1. Overview & Arsitektur Sistem, 🛠️ 2. Komponen Teknis Terimplementasi, 🔮 3. Roadmap Optimalisasi Skala Besar (Production Scale), 📌 4. Ringkasan File Terkait, A. Dual Engine, Fallback & Automated WhatsApp Alert System (`backend/services/gemini_service.py` & `backend/services/fonnte_service.py`), B. Admin Control Panel Configuration (`backend/routers/admin.py` & `frontend/src/app/admin/page.tsx`), C. Clean Markdown Renderer (`frontend/src/components/common/ShieraMarkdownViewer.tsx`), D. Global Chat Drawer & Floating Minimize Widget (`frontend/src/components/common/ShieraAiReportWidget.tsx` & `frontend/src/store/useAiReportStore.ts`) (+4 more)

### Community 45 - "AgencyOS - Enterprise Digital Agency Social Management Platform"
Cohesion: 0.20
Nodes (9): 1. Run Backend (FastAPI), 2. Run Frontend (Next.js 15), AgencyOS - Enterprise Digital Agency Social Management Platform, Backend, Default Configured Credentials, Frontend, Getting Started, Key Features MVP 1.0 (+1 more)

### Community 49 - "UserSubscription"
Cohesion: 0.25
Nodes (13): Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., SubscriptionPlan, UserSubscription, WaOtpVerification, CheckoutRequest, OtpSendRequest (+5 more)

### Community 54 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (20): jsonLd, metadata, LoginPage(), PUBLIC_SPLASH_PATHS, SplashScreen(), Sidebar(), SidebarProps, TIER_COLORS (+12 more)

### Community 57 - "firebase_auth.py"
Cohesion: 0.13
Nodes (20): Settings, require_admin(), FirebaseVerifyRequest, get_current_user_from_token(), get_me(), BaseModel, get, post (+12 more)

### Community 62 - "SecurityMiddleware"
Cohesion: 0.23
Nodes (6): InMemoryRateLimiter, Request, SecurityMiddleware, _get_agent_lock(), BaseHTTPMiddleware, Lock

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 68 - "competitors.py"
Cohesion: 0.07
Nodes (68): CompetitorAccount, CompetitorPost, Reset Competitor Data Script Deletes all records from competitor_posts and…, add_competitor(), delete_competitor(), get_add_competitor_status(), get_benchmark_matrix(), _get_cached_competitor_profile() (+60 more)

### Community 71 - "QueueService"
Cohesion: 0.20
Nodes (12): PostPublishResult, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, Any, Session, QueueService, Queue Engine menggunakan background tasks FastAPI. Mengelola publish job per…, Creates PublishJob records and executes them immediately., Sinkronisasi hasil publish dari PostForMe untuk satu target. Mengambil data… (+4 more)

### Community 79 - "accounts/page.tsx"
Cohesion: 0.09
Nodes (26): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), AccountBriefingModal(), AccountBriefingModalProps, DEFAULT_PILLARS (+18 more)

### Community 82 - "StorageService"
Cohesion: 0.20
Nodes (7): Any, Deletes a single file object permanently from Backblaze B2 bucket, including…, Permanently deletes multiple file objects and all their versions/delete markers…, Uploads file content to Backblaze B2 under…, Backblaze B2 S3 Compatible Object Storage Service. Strictly isolated under root…, Lists ONLY objects strictly starting with 'AgencyOS/' prefix from Backblaze B2…, StorageService

## Knowledge Gaps
- **312 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `get_user_workspace`, `models.py`, `competitors.py`, `admin.py`, `QueueService`, `posts.py`, `billing.py`, `statistics.py`, `UserSubscription`, `Session`, `reset_subscriptions.py`, `Session`, `firebase_auth.py`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `models.py`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `ActivityLog` connect `User` to `models.py`, `competitors.py`, `media.py`, `posts.py`, `statistics.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 51 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 51 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `WorkspaceMember` (e.g. with `AssignPlanByEmailRequest` and `InstagramTestRequest`) actually correct?**
  _`WorkspaceMember` has 33 INFERRED edges - model-reasoned connections that need verification._