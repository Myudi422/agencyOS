# Graph Report - agencyOS  (2026-08-05)

## Corpus Check
- 139 files · ~763,238 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1396 nodes · 3270 edges · 69 communities (51 shown, 18 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 417 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `efd6fbb7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- Session
- posts.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- admin.py
- media.py
- fetchApi
- api.ts
- useStore
- useAuthStore
- get_user_workspace
- gemini_service.py
- .apply_watermark
- GeminiService
- compilerOptions
- firebase
- Session
- [campaignId]/page.tsx
- InstagrapiService
- ActivityLog
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- competitor-spy/page.tsx
- Sidebar.tsx
- queue/page.tsx
- YTPlayer
- Components
- MetaAdapter
- instagrapi_service.py
- 3. Routers & Endpoints (Backend)
- clear_all_activity_logs
- app/page.tsx
- package.json
- services
- server.js
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- postforme_webhook
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- date-fns
- react
- next.config.js
- next-env.d.ts
- html2canvas
- next
- models.py
- tailwind-merge
- zustand
- SecurityMiddleware
- Token-efficient agent
- firebase_auth.py
- rules/token-efficient.md
- User
- workflows/token-efficient.md
- database.py
- migrate_kol_stats.py

## God Nodes (most connected - your core abstractions)
1. `User` - 150 edges
2. `fetchApi()` - 62 edges
3. `ActivityLog` - 59 edges
4. `SocialAccount` - 55 edges
5. `WorkspaceMember` - 44 edges
6. `Workspace` - 43 edges
7. `useStore` - 42 edges
8. `AccountPlatform` - 33 edges
9. `get_user_workspace()` - 32 edges
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

## Communities (69 total, 18 thin omitted)

### Community 1 - "Session"
Cohesion: 0.11
Nodes (21): delete_setting(), delete_user(), get_plans(), get_settings(), list_users(), delete, get, post (+13 more)

### Community 2 - "posts.py"
Cohesion: 0.14
Nodes (27): PostType, create_media_upload_url(), create_post(), delete_post(), get_posts(), patch_post(), PostCreate, PostPatch (+19 more)

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
Cohesion: 0.10
Nodes (54): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., RoleEnum, Setting, SubscriptionPlan, SubscriptionStatus (+46 more)

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (32): bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items(), MediaUpdate (+24 more)

### Community 8 - "fetchApi"
Cohesion: 0.12
Nodes (18): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS, DashboardImageThumbnail(), DashboardPage(), getProxiedImageUrl() (+10 more)

### Community 9 - "api.ts"
Cohesion: 0.20
Nodes (8): Portal(), KolAddEditModal(), KolAddEditModalProps, KolDatabaseDrawerProps, KolProfileItem, TIER_BADGES, PLATFORM_BADGES, PostComposerModal()

### Community 10 - "useStore"
Cohesion: 0.10
Nodes (30): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), ClientsPage(), MediaPage(), OnboardingPage(), AccountBriefingModal() (+22 more)

### Community 11 - "useAuthStore"
Cohesion: 0.10
Nodes (24): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, OAuthCallbackHandler(), BillingSuccessContent(), dynamic, SubscriptionGuard() (+16 more)

### Community 12 - "get_user_workspace"
Cohesion: 0.05
Nodes (71): bulk_action(), delete_account(), get_account_briefing(), get_account_watermark(), get_accounts(), preview_watermark(), delete, get (+63 more)

### Community 14 - ".apply_watermark"
Cohesion: 0.20
Nodes (8): Any, Watermark Service — High Performance Image Watermarking Engine for agencyOS…, Returns base64 data URI string of watermarked image for frontend live preview., Calculates top-left (X, Y) coordinate for watermark placement based on 9-point…, Download remote logo image via httpx., Applies a watermark (Text or Image Logo) onto the base image. Config schema: {…, WatermarkService, Image

### Community 15 - "GeminiService"
Cohesion: 0.13
Nodes (18): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+10 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 18 - "Session"
Cohesion: 0.11
Nodes (23): cancel_postforme_post(), delete_queue_job(), _fallback_local_results(), get_postforme_posts(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks (+15 more)

### Community 19 - "[campaignId]/page.tsx"
Cohesion: 0.09
Nodes (26): CampaignDetailPage(), DELIVERABLE_STATUS_COLORS, PAYMENT_STATUS_BADGES, KolCampaignsPage(), formatNumberToRupiahString(), getTerbilangShort(), parseRupiahStringToNumber(), RupiahInput() (+18 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.10
Nodes (21): InstagrapiService, Any, Session, Handler called by instagrapi when Instagram forces a password change during…, Handler called by instagrapi when Instagram requires verification code…, Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table., Generates a 6-digit TOTP verification code from 2FA Secret Key., Perform login via username & password using instagrapi Client with Challenge… (+13 more)

### Community 21 - "ActivityLog"
Cohesion: 0.08
Nodes (94): AccountPlatform, AccountStatus, ActivityLog, Client, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable (+86 more)

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

### Community 27 - "competitor-spy/page.tsx"
Cohesion: 0.17
Nodes (12): ActiveTab, AddJobState, Competitor, CompetitorPost, CompetitorProfilePreview, CompetitorSpyPage(), ConnectedIgAccount, CompetitorProgressWidget() (+4 more)

### Community 28 - "Sidebar.tsx"
Cohesion: 0.12
Nodes (18): jsonLd, metadata, LoginPage(), Sidebar(), SidebarProps, TIER_COLORS, TIER_ICONS, AuthProvider() (+10 more)

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

### Community 41 - "AgencyOS Backend Documentation"
Cohesion: 0.11
Nodes (17): AgencyOS Backend Documentation, **Atau Jika Berada di Dalam Folder `backend` (dengan venv aktif):**, **Dari Folder Root `agencyOS`:**, **Di Linux / macOS:**, **Di Windows (Command Prompt / CMD):**, **Di Windows (PowerShell):**, 🛠️ Langkah 1: Pindah ke Direktori Backend, 🐍 Langkah 2: Membuat Virtual Environment (`venv`) (+9 more)

### Community 42 - "🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)"
Cohesion: 0.13
Nodes (14): 📊 1. Matriks Kapasitas Infrastruktur, 🏗️ 2. Roadmap Upscaling Bertahap, 🛠️ 3. Langkah Implementasi Upscaling, 🧪 4. Load Testing & Benchmark Scripts, 📈 5. Monitoring & Alerting Checklist, A. Install Dependencies, 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`), B. Konfigurasi Redis Queue (`backend/services/redis_queue.py`) (+6 more)

### Community 43 - "postforme_webhook"
Cohesion: 0.18
Nodes (12): list_postforme_webhooks(), postforme_webhook(), BackgroundTasks, get, post, Request, Menerima event dari PostForMe API. PostForMe mengirim POST request dengan: -…, Setup / daftarkan webhook ke PostForMe secara otomatis. Panggil endpoint ini… (+4 more)

### Community 44 - "🛠️ 2. Komponen Teknis Terimplementasi"
Cohesion: 0.15
Nodes (12): 🚀 1. Overview & Arsitektur Sistem, 🛠️ 2. Komponen Teknis Terimplementasi, 🔮 3. Roadmap Optimalisasi Skala Besar (Production Scale), 📌 4. Ringkasan File Terkait, A. Dual Engine, Fallback & Automated WhatsApp Alert System (`backend/services/gemini_service.py` & `backend/services/fonnte_service.py`), B. Admin Control Panel Configuration (`backend/routers/admin.py` & `frontend/src/app/admin/page.tsx`), C. Clean Markdown Renderer (`frontend/src/components/common/ShieraMarkdownViewer.tsx`), D. Global Chat Drawer & Floating Minimize Widget (`frontend/src/components/common/ShieraAiReportWidget.tsx` & `frontend/src/store/useAiReportStore.ts`) (+4 more)

### Community 45 - "AgencyOS - Enterprise Digital Agency Social Management Platform"
Cohesion: 0.20
Nodes (9): 1. Run Backend (FastAPI), 2. Run Frontend (Next.js 15), AgencyOS - Enterprise Digital Agency Social Management Platform, Backend, Default Configured Credentials, Frontend, Getting Started, Key Features MVP 1.0 (+1 more)

### Community 56 - "models.py"
Cohesion: 0.14
Nodes (25): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, Media, Post, PostPublishResult, PostStatus, PostTarget, PublishJob (+17 more)

### Community 62 - "SecurityMiddleware"
Cohesion: 0.29
Nodes (4): InMemoryRateLimiter, Request, SecurityMiddleware, BaseHTTPMiddleware

### Community 64 - "Token-efficient agent"
Cohesion: 0.25
Nodes (7): Graphify-first rule, Mandatory workflow, Preferred approach, Responsibilities, Token-efficient agent, Tool preferences, When to use this agent

### Community 65 - "firebase_auth.py"
Cohesion: 0.13
Nodes (20): Settings, require_admin(), get_current_user_from_token(), get_me(), get, post, Session, Firebase Auth Router — /auth/firebase Verifies Google Firebase ID Token and… (+12 more)

### Community 68 - "User"
Cohesion: 0.05
Nodes (113): CompetitorAccount, CompetitorPost, User, Reset Competitor Data Script Deletes all records from competitor_posts and…, reset_competitors(), add_competitor(), AddCompetitorRequest, CompetitorResponse (+105 more)

### Community 71 - "database.py"
Cohesion: 0.07
Nodes (10): get_db(), Migration Script: Add briefing column to social_accounts table, Migration Script: Add social_account_id column to competitor_accounts table, Database Migration Script — Migrate database schema from Stripe to Midtrans.…, Migration Script: Create KOL Campaign & Deliverable Tracker tables, Migration Script: Add ai_brief column to posts table, Migration: Tambah tabel post_publish_results dan kolom baru ke posts. Jalankan:…, Database Migration — WA OTP Verification Menambah kolom phone_number &… (+2 more)

## Knowledge Gaps
- **299 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Session`, `firebase_auth.py`, `posts.py`, `admin.py`, `database.py`, `get_user_workspace`, `Session`, `ActivityLog`, `models.py`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `models.py`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `Setting` connect `admin.py` to `instagrapi_service.py`, `gemini_service.py`, `GeminiService`, `InstagrapiService`, `models.py`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Are the 32 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 35 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `WorkspaceMember` (e.g. with `AssignPlanByEmailRequest` and `InstagramTestRequest`) actually correct?**
  _`WorkspaceMember` has 29 INFERRED edges - model-reasoned connections that need verification._