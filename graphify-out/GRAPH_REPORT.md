# Graph Report - agencyOS  (2026-08-10)

## Corpus Check
- 148 files · ~777,302 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1526 nodes · 3553 edges · 78 communities (59 shown, 19 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 436 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72a1e1e7`
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
- media.py
- competitor-spy/page.tsx
- kol-campaigns/page.tsx
- useStore.ts
- Sidebar.tsx
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- Session
- Session
- fetchApi
- InstagrapiService
- create_client
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
- run_agent
- 3. Routers & Endpoints (Backend)
- date-fns
- app/page.tsx
- package.json
- services
- server.js
- posts.py
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- BaseModel
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- postforme_webhook
- User
- main.py
- next.config.js
- next-env.d.ts
- useStore
- agents.py
- get
- firebase_auth.py
- delete_agent
- SecurityMiddleware
- database.py
- Token-efficient agent
- post
- firebase
- rules/token-efficient.md
- competitors.py
- workflows/token-efficient.md
- QueueService
- html2canvas
- next
- Session
- react
- tailwind-merge
- zustand

## God Nodes (most connected - your core abstractions)
1. `User` - 161 edges
2. `fetchApi()` - 69 edges
3. `ActivityLog` - 61 edges
4. `SocialAccount` - 57 edges
5. `useStore` - 46 edges
6. `get_user_workspace()` - 42 edges
7. `WorkspaceMember` - 42 edges
8. `Workspace` - 41 edges
9. `AccountPlatform` - 33 edges
10. `useAuthStore` - 31 edges

## Surprising Connections (you probably didn't know these)
- `AssignPlanByEmailRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `InstagramTestRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `PlanUpdateRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `SettingUpsertRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py
- `SubscriptionOverrideRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/admin.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (78 total, 19 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "accounts/page.tsx"
Cohesion: 0.09
Nodes (26): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), AccountBriefingModal(), AccountBriefingModalProps, DEFAULT_PILLARS (+18 more)

### Community 2 - "models.py"
Cohesion: 0.36
Nodes (7): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Post, PostTarget, PublishJob, Webhook handler untuk menerima event dari PostForMe API. PostForMe mengirim…, reset_and_seed_database()

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
Cohesion: 0.06
Nodes (83): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., Setting, SubscriptionPlan, SubscriptionStatus, UserSubscription (+75 more)

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (33): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+25 more)

### Community 8 - "competitor-spy/page.tsx"
Cohesion: 0.17
Nodes (12): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, CompetitorProgressWidget() (+4 more)

### Community 9 - "kol-campaigns/page.tsx"
Cohesion: 0.13
Nodes (15): KolCampaignsPage(), CampaignCard(), CampaignCardProps, CampaignItem, STATUS_BADGES, CampaignCreateModalProps, AccountItem, KolAccountSelector() (+7 more)

### Community 10 - "useStore.ts"
Cohesion: 0.15
Nodes (13): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, MediaPage(), MoveToFolderModal(), MoveToFolderModalProps (+5 more)

### Community 11 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (20): jsonLd, metadata, LoginPage(), PUBLIC_SPLASH_PATHS, SplashScreen(), Sidebar(), SidebarProps, TIER_COLORS (+12 more)

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

### Community 17 - "Session"
Cohesion: 0.13
Nodes (22): create_agent(), get_agent(), get_agent_logs(), list_agents(), AgentConfig, AgentRunLog, BackgroundTasks, get (+14 more)

### Community 18 - "Session"
Cohesion: 0.11
Nodes (23): cancel_postforme_post(), delete_queue_job(), _fallback_local_results(), get_postforme_posts(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks (+15 more)

### Community 19 - "fetchApi"
Cohesion: 0.07
Nodes (34): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, CampaignDetailPage(), DELIVERABLE_STATUS_COLORS (+26 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.09
Nodes (22): InstagrapiService, Any, Session, Instagrapi Service — Instagram Private API Integration for Competitor Spy Uses…, Handler called by instagrapi when Instagram forces a password change during…, Handler called by instagrapi when Instagram requires verification code…, Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table., Generates a 6-digit TOTP verification code from 2FA Secret Key. (+14 more)

### Community 21 - "create_client"
Cohesion: 0.22
Nodes (9): create_client(), delete_client(), get_clients(), delete, get, post, Session, Retrieves all clients under a workspace owned by the current user. (+1 more)

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

### Community 27 - "get_user_workspace"
Cohesion: 0.21
Nodes (20): bulk_action(), delete_account(), get_account_briefing(), get_account_watermark(), get_accounts(), preview_watermark(), delete, get (+12 more)

### Community 28 - "ShieraAiReportWidget.tsx"
Cohesion: 0.15
Nodes (13): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+5 more)

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

### Community 33 - "run_agent"
Cohesion: 0.29
Nodes (8): _extract_composer_payload(), _fail_run(), AgentConfig, AgentRunLog, Session, Extract ```json ... ``` composer_payload block from AI output., Core agent runner. Returns summary dict. Called by scheduler…, run_agent()

### Community 34 - "3. Routers & Endpoints (Backend)"
Cohesion: 0.09
Nodes (22): 1. Configuration & Models (Backend), 2. PostForMe Service & Queue Engine (Backend), 3. Routers & Endpoints (Backend), 4. Frontend UI Rework, Automated Tests, Implementation Plan - PostForMe API Integration & Full Platform Overhaul, Manual Verification, [MODIFY] [accounts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/accounts.py) (+14 more)

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
Nodes (35): PostStatus, PostType, approve_public_post_review(), create_media_upload_url(), create_post(), delete_post(), generate_ai_caption(), GenerateAICaptionRequest (+27 more)

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

### Community 49 - "postforme_webhook"
Cohesion: 0.16
Nodes (14): list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post, Request, Menerima event dari PostForMe API. PostForMe mengirim POST request dengan: -… (+6 more)

### Community 50 - "User"
Cohesion: 0.07
Nodes (130): AccountPlatform, AccountStatus, ActivityLog, Client, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable (+122 more)

### Community 54 - "useStore"
Cohesion: 0.15
Nodes (19): OAuthCallbackHandler(), DashboardImageThumbnail(), DashboardPage(), getProxiedImageUrl(), OnboardingPage(), SubscriptionGuard(), TIER_META, UploadProgressWidget() (+11 more)

### Community 55 - "agents.py"
Cohesion: 0.18
Nodes (14): Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, AgentRunStatus, Base, str, Agent Models — Shiera AI Agent System Stores agent configurations and run…, Konfigurasi satu AI Agent per workspace. Satu agent = 1 jadwal otomatis yang… (+6 more)

### Community 57 - "firebase_auth.py"
Cohesion: 0.14
Nodes (19): Settings, FirebaseVerifyRequest, get_current_user_from_token(), get_me(), Firebase Auth Router — /auth/firebase Verifies Google Firebase ID Token and…, Verifies Firebase ID token (from Google Sign-In). Creates or updates AgencyOS…, Returns current authenticated user info from Authorization header., Dependency: extracts Firebase token from Authorization header and returns DB… (+11 more)

### Community 58 - "delete_agent"
Cohesion: 0.40
Nodes (5): delete_agent(), delete_agent_log(), delete, Delete an agent and all its run logs., Delete a single agent run log entry.

### Community 62 - "SecurityMiddleware"
Cohesion: 0.29
Nodes (4): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware

### Community 63 - "database.py"
Cohesion: 0.05
Nodes (20): get_db(), Migration Script: Add briefing column to social_accounts table, Migration Script: Add social_account_id column to competitor_accounts table, Database Migration Script — Migrate database schema from Stripe to Midtrans.…, Migration Script: Create KOL Campaign & Deliverable Tracker tables, column_exists(), migrate(), Migration Script: Add ai_brief column to posts table (+12 more)

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 68 - "competitors.py"
Cohesion: 0.07
Nodes (72): CompetitorAccount, CompetitorPost, Reset Competitor Data Script Deletes all records from competitor_posts and…, reset_competitors(), add_competitor(), AddCompetitorRequest, delete_competitor(), get_add_competitor_status() (+64 more)

### Community 71 - "QueueService"
Cohesion: 0.20
Nodes (12): PostPublishResult, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, Any, Session, QueueService, Queue Engine menggunakan background tasks FastAPI. Mengelola publish job per…, Creates PublishJob records and executes them immediately., Sinkronisasi hasil publish dari PostForMe untuk satu target. Mengambil data… (+4 more)

## Knowledge Gaps
- **312 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `models.py`, `competitors.py`, `admin.py`, `QueueService`, `posts.py`, `statistics.py`, `Session`, `Session`, `create_client`, `agents.py`, `delete_agent`, `get_user_workspace`, `database.py`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `models.py`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `Setting` connect `admin.py` to `models.py`, `User`, `InstagrapiService`, `GeminiService`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 49 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 49 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 36 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `nextConfig`, `name` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._