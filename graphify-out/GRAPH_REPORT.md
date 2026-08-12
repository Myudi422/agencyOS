# Graph Report - agencyOS  (2026-08-12)

## Corpus Check
- 152 files · ~783,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1599 nodes · 3781 edges · 87 communities (64 shown, 23 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 487 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `122174c9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent/page.tsx
- useStore
- migrate_account_briefing.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- billing.py
- media.py
- competitor-spy/page.tsx
- useStore.ts
- EnstaScraperService
- main.py
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- migrate_competitor_accounts.py
- Session
- fetchApi
- InstagrapiService
- User
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- TikTokScraperService
- database.py
- queue/page.tsx
- YTPlayer
- Components
- MetaAdapter
- get_user_workspace
- 3. Routers & Endpoints (Backend)
- WorkspaceMember
- app/page.tsx
- package.json
- services
- server.js
- models.py
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- migrate_kol_stats.py
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- kol.py
- ActivityLog
- next.config.js
- next-env.d.ts
- Sidebar.tsx
- competitors.py
- migrate_db.py
- kol-campaigns/page.tsx
- agents.py
- SecurityMiddleware
- migrate_kol.py
- Token-efficient agent
- QueueService
- firebase
- rules/token-efficient.md
- migrate_wa_otp.py
- workflows/token-efficient.md
- clear_all_activity_logs
- ShieraAiReportWidget.tsx
- get_agent_logs
- get_clients
- migrate_post_ai_brief.py
- tailwind-merge
- migrate_publish_results.py
- update_agent
- accounts/page.tsx
- agent_service.py
- react
- instagrapi_service.py
- clsx
- jspdf
- date-fns
- @tanstack/react-query

## God Nodes (most connected - your core abstractions)
1. `User` - 176 edges
2. `fetchApi()` - 69 edges
3. `ActivityLog` - 61 edges
4. `SocialAccount` - 57 edges
5. `WorkspaceMember` - 52 edges
6. `Workspace` - 47 edges
7. `useStore` - 46 edges
8. `get_user_workspace()` - 43 edges
9. `UserSubscription` - 35 edges
10. `AccountPlatform` - 33 edges

## Surprising Connections (you probably didn't know these)
- `FirebaseVerifyRequest` --uses--> `PlanTier`  [INFERRED]
  backend/routers/firebase_auth.py → backend/models/models.py
- `FirebaseVerifyRequest` --uses--> `SubscriptionStatus`  [INFERRED]
  backend/routers/firebase_auth.py → backend/models/models.py
- `AgentCreateRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/agents.py → backend/models/models.py
- `AgentUpdateRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/agents.py → backend/models/models.py
- `BulkDeleteLogsRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/agents.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (87 total, 23 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "useStore"
Cohesion: 0.15
Nodes (19): OAuthCallbackHandler(), DashboardImageThumbnail(), DashboardPage(), getProxiedImageUrl(), OnboardingPage(), SubscriptionGuard(), TIER_META, UploadProgressWidget() (+11 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.09
Nodes (26): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+18 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "billing.py"
Cohesion: 0.11
Nodes (31): _activate_user_subscription(), create_checkout(), get_frontend_url(), get_subscription(), _get_user_from_auth(), list_plans(), midtrans_notification(), get (+23 more)

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (33): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+25 more)

### Community 8 - "competitor-spy/page.tsx"
Cohesion: 0.17
Nodes (12): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, CompetitorProgressWidget() (+4 more)

### Community 9 - "useStore.ts"
Cohesion: 0.15
Nodes (13): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, MediaPage(), MoveToFolderModal(), MoveToFolderModalProps (+5 more)

### Community 10 - "EnstaScraperService"
Cohesion: 0.17
Nodes (12): EnstaScraperService, Any, Session, Test proxy connectivity by querying public IP checkers., Unauthenticated OpenGraph fallback for profile metadata., Fetch profile & recent posts using Ensta Guest mode + OpenGraph fallback. 100%…, Fetch competitor profile information., Fetch competitor posts information. (+4 more)

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

### Community 18 - "Session"
Cohesion: 0.13
Nodes (19): delete_queue_job(), _fallback_local_results(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks, delete, get (+11 more)

### Community 19 - "fetchApi"
Cohesion: 0.07
Nodes (34): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, CampaignDetailPage(), DELIVERABLE_STATUS_COLORS (+26 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.08
Nodes (26): InstagrapiService, Any, Session, Fetch configured Residential Proxy setting from DB or parameters., Test proxy connectivity by querying public IP checkers., Create an instagrapi Client preconfigured with Proxy, Bandwidth Optimizations &…, Connects to IMAP mail server (e.g. Gmail) to automatically search and extract…, Handler called by instagrapi when Instagram forces a password change during… (+18 more)

### Community 21 - "User"
Cohesion: 0.10
Nodes (66): PlanTier, Base, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., RoleEnum, Setting, SubscriptionPlan (+58 more)

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
Nodes (15): dependencies, html2canvas, lucide-react, next, react-dom, react-is, recharts, zustand (+7 more)

### Community 27 - "TikTokScraperService"
Cohesion: 0.18
Nodes (10): Any, Session, Test proxy connectivity by querying public IP checkers., Fetch TikTok competitor profile information via Web SSR parsing. 100% Anonymous…, Fetch profile & recent video posts metadata for TikTok competitor. Includes…, Run end-to-end test of TikTok Scraper Engine., Parses count strings like '162.6M', '2.5B', '1,234' to integer., Normalizes various proxy input formats to a valid URL string. Supports: -… (+2 more)

### Community 28 - "database.py"
Cohesion: 0.09
Nodes (17): Settings, get_db(), Reset Subscriptions Script — Clears all user subscriptions in DB. Run: python…, ClientCreate, create_client(), BaseModel, post, Creates a new client under a workspace owned by the current user. (+9 more)

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
Cohesion: 0.15
Nodes (25): bulk_delete_agent_logs(), create_agent(), delete_agent(), delete_agent_log(), get_agent(), get_workspace_agent_limit(), list_agents(), AgentConfig (+17 more)

### Community 34 - "3. Routers & Endpoints (Backend)"
Cohesion: 0.09
Nodes (22): 1. Configuration & Models (Backend), 2. PostForMe Service & Queue Engine (Backend), 3. Routers & Endpoints (Backend), 4. Frontend UI Rework, Automated Tests, Implementation Plan - PostForMe API Integration & Full Platform Overhaul, Manual Verification, [MODIFY] [accounts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/accounts.py) (+14 more)

### Community 35 - "WorkspaceMember"
Cohesion: 0.17
Nodes (23): Workspace, WorkspaceMember, AddCompetitorRequest, CompetitorResponse, BaseModel, ValidateUsernameRequest, FirebaseVerifyRequest, BaseModel (+15 more)

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

### Community 40 - "models.py"
Cohesion: 0.09
Nodes (50): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Post, PostStatus, PostTarget, PostType, PublishJob, str (+42 more)

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
Cohesion: 0.13
Nodes (60): KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType, KolPaymentStatus, KolProfile (+52 more)

### Community 51 - "ActivityLog"
Cohesion: 0.09
Nodes (68): AccountPlatform, AccountStatus, ActivityLog, Client, SocialAccount, AccountBriefingSchema, bulk_action(), BulkActionRequest (+60 more)

### Community 54 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (20): jsonLd, metadata, LoginPage(), PUBLIC_SPLASH_PATHS, SplashScreen(), Sidebar(), SidebarProps, TIER_COLORS (+12 more)

### Community 55 - "competitors.py"
Cohesion: 0.07
Nodes (70): CompetitorAccount, CompetitorPost, Reset Competitor Data Script Deletes all records from competitor_posts and…, add_competitor(), delete_competitor(), _fetch_posts(), _fetch_profile(), get_add_competitor_status() (+62 more)

### Community 57 - "kol-campaigns/page.tsx"
Cohesion: 0.13
Nodes (15): KolCampaignsPage(), CampaignCard(), CampaignCardProps, CampaignItem, STATUS_BADGES, CampaignCreateModalProps, AccountItem, KolAccountSelector() (+7 more)

### Community 58 - "agents.py"
Cohesion: 0.20
Nodes (14): Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentConfig, AgentRunLog, AgentRunStatus, Base, str, Agent Models — Shiera AI Agent System Stores agent configurations and run…, Konfigurasi satu AI Agent per workspace. Satu agent = 1 jadwal otomatis yang… (+6 more)

### Community 62 - "SecurityMiddleware"
Cohesion: 0.26
Nodes (5): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware, Lock

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 65 - "QueueService"
Cohesion: 0.09
Nodes (26): PostPublishResult, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post (+18 more)

### Community 71 - "clear_all_activity_logs"
Cohesion: 0.25
Nodes (9): clear_all_activity_logs(), delete_activity_log(), get_activity_logs(), delete, get, Session, Retrieves chronological activity audit logs., Deletes a specific activity log entry. (+1 more)

### Community 72 - "ShieraAiReportWidget.tsx"
Cohesion: 0.15
Nodes (13): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+5 more)

### Community 73 - "get_agent_logs"
Cohesion: 0.29
Nodes (7): cron_trigger(), get_agent_logs(), AgentRunLog, get, Public endpoint for external cron services (Cron-job.org / QStash) to trigger…, Get paginated run history for an agent., _serialize_log()

### Community 74 - "get_clients"
Cohesion: 0.33
Nodes (6): delete_client(), get_clients(), delete, get, Session, Retrieves all clients under a workspace owned by the current user.

### Community 78 - "update_agent"
Cohesion: 0.67
Nodes (3): patch, Update agent configuration. Reschedules if schedule fields change., update_agent()

### Community 79 - "accounts/page.tsx"
Cohesion: 0.09
Nodes (26): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), AccountBriefingModal(), AccountBriefingModalProps, DEFAULT_PILLARS (+18 more)

### Community 80 - "agent_service.py"
Cohesion: 0.25
Nodes (10): _extract_composer_payload(), _fail_run(), _get_agent_lock(), AgentConfig, AgentRunLog, Session, Agent Service — Core AI Agent Runner Mengeksekusi satu AgentConfig: ambil akun…, Extract ```json ... ``` composer_payload block from AI output. (+2 more)

### Community 81 - "react"
Cohesion: 0.67
Nodes (3): react, TikTokCreatorEmbed(), react

## Knowledge Gaps
- **312 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `get_user_workspace`, `QueueService`, `WorkspaceMember`, `billing.py`, `models.py`, `get_agent_logs`, `get_clients`, `statistics.py`, `update_agent`, `kol.py`, `Session`, `ActivityLog`, `competitors.py`, `agents.py`, `database.py`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `Setting` connect `User` to `WorkspaceMember`, `models.py`, `EnstaScraperService`, `GeminiService`, `instagrapi_service.py`, `InstagrapiService`, `competitors.py`, `TikTokScraperService`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `InstagrapiService` connect `InstagrapiService` to `instagrapi_service.py`, `User`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `WorkspaceMember` (e.g. with `AssignPlanByEmailRequest` and `EnstaScraperTestRequest`) actually correct?**
  _`WorkspaceMember` has 36 INFERRED edges - model-reasoned connections that need verification._