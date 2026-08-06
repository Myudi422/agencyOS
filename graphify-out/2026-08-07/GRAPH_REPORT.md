# Graph Report - agencyOS  (2026-08-07)

## Corpus Check
- 148 files · ~776,634 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1521 nodes · 3577 edges · 79 communities (62 shown, 17 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 444 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7705b108`
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
- media.py
- fetchApi
- ActivityLog
- calendar/page.tsx
- Sidebar.tsx
- statistics.py
- agent_scheduler.py
- .apply_watermark
- GeminiService
- compilerOptions
- Session
- Session
- [campaignId]/page.tsx
- InstagrapiService
- auth.py
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- User
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
- workspaces.py
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- postforme_webhook
- kol.py
- main.py
- next.config.js
- next-env.d.ts
- useAuthStore
- agent_service.py
- calendar.py
- firebase_auth.py
- delete_agent
- SecurityMiddleware
- database.py
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
- react
- tailwind-merge
- reset_subscriptions.py
- zustand

## God Nodes (most connected - your core abstractions)
1. `User` - 167 edges
2. `fetchApi()` - 69 edges
3. `ActivityLog` - 61 edges
4. `SocialAccount` - 57 edges
5. `useStore` - 46 edges
6. `WorkspaceMember` - 45 edges
7. `Workspace` - 44 edges
8. `get_user_workspace()` - 42 edges
9. `AccountPlatform` - 33 edges
10. `UserSubscription` - 32 edges

## Surprising Connections (you probably didn't know these)
- `AgentCreateRequest` --uses--> `AgentRunLog`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py
- `AgentUpdateRequest` --uses--> `AgentRunLog`  [INFERRED]
  backend/routers/agents.py → backend/models/agent_models.py
- `BlueskyConnectRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py
- `ChallengeResolveRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py
- `CookieLoginRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/auth.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (79 total, 17 thin omitted)

### Community 0 - "agent/page.tsx"
Cohesion: 0.13
Nodes (19): AgentPage(), DAY_LABELS, formatDateTime(), formatTimeOnly(), LogCard(), PLATFORM_ICONS, STATUS_CONFIG, AgentCreateModal() (+11 more)

### Community 1 - "useStore"
Cohesion: 0.10
Nodes (30): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), MediaPage(), OnboardingPage(), AccountBriefingModal() (+22 more)

### Community 2 - "models.py"
Cohesion: 0.32
Nodes (9): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Post, PostPublishResult, PostTarget, PublishJob, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, Webhook handler untuk menerima event dari PostForMe API. PostForMe mengirim… (+1 more)

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
Cohesion: 0.05
Nodes (87): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., RoleEnum, Setting, SubscriptionPlan, SubscriptionStatus, WaOtpVerification (+79 more)

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (33): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+25 more)

### Community 8 - "fetchApi"
Cohesion: 0.08
Nodes (33): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, DEFAULT_PLANS (+25 more)

### Community 9 - "ActivityLog"
Cohesion: 0.34
Nodes (18): AccountStatus, ActivityLog, Client, SocialAccount, AccountBriefingSchema, BulkActionRequest, BaseModel, WatermarkConfigSchema (+10 more)

### Community 10 - "calendar/page.tsx"
Cohesion: 0.40
Nodes (5): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS

### Community 11 - "Sidebar.tsx"
Cohesion: 0.15
Nodes (16): LoginPage(), Sidebar(), SidebarProps, TIER_COLORS, TIER_ICONS, AuthProvider(), Providers(), getIdToken() (+8 more)

### Community 12 - "statistics.py"
Cohesion: 0.13
Nodes (30): AIBrainstormRequest, AISummaryRequest, ChatItem, _compute_daily_breakdown(), _fetch_all_posts_for_account(), generate_ai_brainstorm(), generate_ai_summary(), get_statistics_accounts() (+22 more)

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
Cohesion: 0.18
Nodes (17): create_agent(), get_agent(), get_agent_logs(), list_agents(), AgentConfig, BackgroundTasks, get, post (+9 more)

### Community 18 - "Session"
Cohesion: 0.13
Nodes (18): cancel_postforme_post(), delete_queue_job(), _fallback_local_results(), get_publish_history(), get_queue_status(), BackgroundTasks, delete, post (+10 more)

### Community 19 - "[campaignId]/page.tsx"
Cohesion: 0.09
Nodes (25): CampaignDetailPage(), DELIVERABLE_STATUS_COLORS, PAYMENT_STATUS_BADGES, KolCampaignsPage(), formatNumberToRupiahString(), getTerbilangShort(), parseRupiahStringToNumber(), RupiahInput() (+17 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.09
Nodes (22): InstagrapiService, Any, Session, Instagrapi Service — Instagram Private API Integration for Competitor Spy Uses…, Handler called by instagrapi when Instagram forces a password change during…, Handler called by instagrapi when Instagram requires verification code…, Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table., Generates a 6-digit TOTP verification code from 2FA Secret Key. (+14 more)

### Community 21 - "auth.py"
Cohesion: 0.14
Nodes (31): extract_followers_count(), _get_user_target_workspace(), instagram_challenge_resolve(), instagram_connect(), instagram_cookie_login(), instagram_credential_login(), meta_callback(), meta_connect() (+23 more)

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

### Community 27 - "User"
Cohesion: 0.15
Nodes (30): User, bulk_action(), delete_account(), get_account_briefing(), get_account_watermark(), get_accounts(), preview_watermark(), delete (+22 more)

### Community 28 - "ShieraAiReportWidget.tsx"
Cohesion: 0.10
Nodes (20): ChatArea(), CONTENT_FORMATS, CONTENT_PILLARS, extractComposerPayload(), getDateRange(), PanelView, PERIOD_OPTIONS, PeriodKey (+12 more)

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
Cohesion: 0.21
Nodes (13): AgentConfig, AgentRunStatus, str, Konfigurasi satu AI Agent per workspace. Satu agent = 1 jadwal otomatis yang…, AgentCreateRequest, AgentUpdateRequest, AgentRunLog, BaseModel (+5 more)

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
Nodes (37): PostStatus, PostType, Subscription aktif milik satu user., UserSubscription, approve_public_post_review(), create_media_upload_url(), create_post(), delete_post() (+29 more)

### Community 41 - "AgencyOS Backend Documentation"
Cohesion: 0.11
Nodes (17): AgencyOS Backend Documentation, **Atau Jika Berada di Dalam Folder `backend` (dengan venv aktif):**, **Dari Folder Root `agencyOS`:**, **Di Linux / macOS:**, **Di Windows (Command Prompt / CMD):**, **Di Windows (PowerShell):**, 🛠️ Langkah 1: Pindah ke Direktori Backend, 🐍 Langkah 2: Membuat Virtual Environment (`venv`) (+9 more)

### Community 42 - "🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)"
Cohesion: 0.13
Nodes (14): 📊 1. Matriks Kapasitas Infrastruktur, 🏗️ 2. Roadmap Upscaling Bertahap, 🛠️ 3. Langkah Implementasi Upscaling, 🧪 4. Load Testing & Benchmark Scripts, 📈 5. Monitoring & Alerting Checklist, A. Install Dependencies, 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`), B. Konfigurasi Redis Queue (`backend/services/redis_queue.py`) (+6 more)

### Community 43 - "workspaces.py"
Cohesion: 0.23
Nodes (12): create_workspace(), get_workspaces(), OnboardingSetupRequest, BaseModel, get, post, Session, Onboarding endpoint — creates the first workspace for a new user. Validates… (+4 more)

### Community 44 - "🛠️ 2. Komponen Teknis Terimplementasi"
Cohesion: 0.15
Nodes (12): 🚀 1. Overview & Arsitektur Sistem, 🛠️ 2. Komponen Teknis Terimplementasi, 🔮 3. Roadmap Optimalisasi Skala Besar (Production Scale), 📌 4. Ringkasan File Terkait, A. Dual Engine, Fallback & Automated WhatsApp Alert System (`backend/services/gemini_service.py` & `backend/services/fonnte_service.py`), B. Admin Control Panel Configuration (`backend/routers/admin.py` & `frontend/src/app/admin/page.tsx`), C. Clean Markdown Renderer (`frontend/src/components/common/ShieraMarkdownViewer.tsx`), D. Global Chat Drawer & Floating Minimize Widget (`frontend/src/components/common/ShieraAiReportWidget.tsx` & `frontend/src/store/useAiReportStore.ts`) (+4 more)

### Community 45 - "AgencyOS - Enterprise Digital Agency Social Management Platform"
Cohesion: 0.20
Nodes (9): 1. Run Backend (FastAPI), 2. Run Frontend (Next.js 15), AgencyOS - Enterprise Digital Agency Social Management Platform, Backend, Default Configured Credentials, Frontend, Getting Started, Key Features MVP 1.0 (+1 more)

### Community 49 - "postforme_webhook"
Cohesion: 0.16
Nodes (14): list_postforme_webhooks(), postforme_webhook(), _process_post_result_event(), BackgroundTasks, get, post, Request, Menerima event dari PostForMe API. PostForMe mengirim POST request dengan: -… (+6 more)

### Community 50 - "kol.py"
Cohesion: 0.14
Nodes (65): AccountPlatform, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType, KolPaymentStatus (+57 more)

### Community 54 - "useAuthStore"
Cohesion: 0.08
Nodes (28): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, OAuthCallbackHandler(), BillingSuccessContent(), dynamic, DashboardImageThumbnail() (+20 more)

### Community 55 - "agent_service.py"
Cohesion: 0.14
Nodes (14): Migration Script: Create agent_configs and agent_run_logs tables. Run: python…, AgentRunLog, Base, Agent Models — Shiera AI Agent System Stores agent configurations and run…, Log setiap kali agent dijalankan (manual atau terjadwal). Menyimpan hasil brief…, _extract_composer_payload(), _fail_run(), AgentConfig (+6 more)

### Community 56 - "calendar.py"
Cohesion: 0.21
Nodes (15): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, put (+7 more)

### Community 57 - "firebase_auth.py"
Cohesion: 0.16
Nodes (13): Settings, get_current_user_from_token(), get_me(), get, Session, Firebase Auth Router — /auth/firebase Verifies Google Firebase ID Token and…, Returns current authenticated user info from Authorization header., Dependency: extracts Firebase token from Authorization header and returns DB… (+5 more)

### Community 58 - "delete_agent"
Cohesion: 0.40
Nodes (5): delete_agent(), delete_agent_log(), delete, Delete an agent and all its run logs., Delete a single agent run log entry.

### Community 62 - "SecurityMiddleware"
Cohesion: 0.29
Nodes (4): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware

### Community 63 - "database.py"
Cohesion: 0.06
Nodes (19): get_db(), Migration Script: Add briefing column to social_accounts table, Migration Script: Add social_account_id column to competitor_accounts table, Database Migration Script — Migrate database schema from Stripe to Midtrans.…, Migration Script: Create KOL Campaign & Deliverable Tracker tables, Migration Script: Add ai_brief column to posts table, Migration: Tambah tabel post_publish_results dan kolom baru ke posts. Jalankan:…, Database Migration — WA OTP Verification Menambah kolom phone_number &… (+11 more)

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 68 - "competitors.py"
Cohesion: 0.07
Nodes (72): CompetitorAccount, CompetitorPost, Reset Competitor Data Script Deletes all records from competitor_posts and…, add_competitor(), AddCompetitorRequest, CompetitorResponse, delete_competitor(), get_add_competitor_status() (+64 more)

### Community 71 - "QueueService"
Cohesion: 0.21
Nodes (10): Any, Session, QueueService, Queue Engine menggunakan background tasks FastAPI. Mengelola publish job per…, Creates PublishJob records and executes them immediately., Sinkronisasi hasil publish dari PostForMe untuk satu target. Mengambil data…, Kurangi 1 kredit dari user yang membuat post setelah PostForMe konfirmasi…, Sinkronisasi manual komprehensif: Ambil 100 hasil publikasi terbaru dari… (+2 more)

## Knowledge Gaps
- **312 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `agents.py`, `models.py`, `competitors.py`, `admin.py`, `QueueService`, `posts.py`, `ActivityLog`, `workspaces.py`, `statistics.py`, `reset_subscriptions.py`, `Session`, `kol.py`, `Session`, `auth.py`, `calendar.py`, `firebase_auth.py`, `delete_agent`, `database.py`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `models.py`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `AgentConfig` connect `agents.py` to `main.py`, `agent_scheduler.py`, `agent_service.py`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 50 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 50 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 36 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `nextConfig`, `name` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._