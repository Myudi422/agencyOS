# Graph Report - agencyOS  (2026-08-02)

## Corpus Check
- 131 files · ~752,774 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1309 nodes · 2793 edges · 75 communities (48 shown, 27 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 224 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a9aea8a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserSubscription
- competitors.py
- kol.py
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- ActivityLog
- media.py
- calendar/page.tsx
- database.py
- useStore
- useAuthStore
- statistics.py
- models.py
- User
- GeminiService
- compilerOptions
- api.ts
- Session
- dashboard/page.tsx
- InstagrapiService
- migrate_account_briefing.py
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- fetchApi
- auth.ts
- queue/page.tsx
- YTPlayer
- Components
- migrate_post_ai_brief.py
- MetaAdapter
- 3. Routers & Endpoints (Backend)
- clear_all_activity_logs
- app/page.tsx
- package.json
- services
- server.js
- create_workspace
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- migrate_kol_stats.py
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- useConfirmStore.ts
- date-fns
- firebase
- next.config.js
- next-env.d.ts
- html2canvas
- next
- react
- tailwind-merge
- zustand
- calendar.py
- migrate_publish_results.py
- migrate_competitor_accounts.py
- migrate_db.py
- migrate_kol.py
- migrate_wa_otp.py
- BaseModel
- delete
- get
- post
- put
- Session
- Workspace

## God Nodes (most connected - your core abstractions)
1. `User` - 109 edges
2. `fetchApi()` - 54 edges
3. `ActivityLog` - 43 edges
4. `SocialAccount` - 41 edges
5. `useStore` - 41 edges
6. `get_user_workspace()` - 30 edges
7. `useAuthStore` - 29 edges
8. `UserSubscription` - 27 edges
9. `WorkspaceMember` - 26 edges
10. `Client` - 26 edges

## Surprising Connections (you probably didn't know these)
- `FirebaseVerifyRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/firebase_auth.py → backend/models/models.py
- `RescheduleRequest` --uses--> `AccountStatus`  [INFERRED]
  backend/routers/calendar.py → backend/models/models.py
- `AIBrainstormRequest` --uses--> `AccountStatus`  [INFERRED]
  backend/routers/statistics.py → backend/models/models.py
- `AISummaryRequest` --uses--> `AccountStatus`  [INFERRED]
  backend/routers/statistics.py → backend/models/models.py
- `ChatItem` --uses--> `AccountStatus`  [INFERRED]
  backend/routers/statistics.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (75 total, 27 thin omitted)

### Community 0 - "UserSubscription"
Cohesion: 0.07
Nodes (69): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., Setting, SubscriptionPlan, SubscriptionStatus, UserSubscription (+61 more)

### Community 1 - "competitors.py"
Cohesion: 0.07
Nodes (67): CompetitorAccount, CompetitorPost, Reset Competitor Data Script Deletes all records from competitor_posts and…, reset_competitors(), add_competitor(), delete_competitor(), get_add_competitor_status(), get_benchmark_matrix() (+59 more)

### Community 2 - "kol.py"
Cohesion: 0.12
Nodes (50): add_kol_to_campaign(), BlacklistRequest, CampaignCreate, CampaignKolAdd, CampaignKolUpdate, CampaignUpdate, create_campaign(), create_deliverable() (+42 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.06
Nodes (39): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+31 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "ActivityLog"
Cohesion: 0.13
Nodes (52): AccountPlatform, AccountStatus, ActivityLog, Client, RoleEnum, SocialAccount, Workspace, WorkspaceMember (+44 more)

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (33): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+25 more)

### Community 8 - "calendar/page.tsx"
Cohesion: 0.40
Nodes (5): CalendarImageThumbnail(), CalendarPage(), getProxiedImageUrl(), PLATFORM_ICONS, PLATFORM_LABELS

### Community 9 - "database.py"
Cohesion: 0.10
Nodes (21): Settings, get_db(), Reset Subscriptions Script — Clears all user subscriptions in DB. Run: python…, get_current_user_from_token(), get_me(), get, post, Session (+13 more)

### Community 10 - "useStore"
Cohesion: 0.10
Nodes (25): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), OAuthCallbackHandler(), ClientsPage(), MediaPage(), OnboardingPage() (+17 more)

### Community 11 - "useAuthStore"
Cohesion: 0.11
Nodes (26): BillingSuccessContent(), dynamic, LoginPage(), SubscriptionGuard(), TIER_META, GlassToastManager(), PUBLIC_SPLASH_PATHS, SplashScreen() (+18 more)

### Community 12 - "statistics.py"
Cohesion: 0.13
Nodes (30): AIBrainstormRequest, AISummaryRequest, ChatItem, _compute_daily_breakdown(), _fetch_all_posts_for_account(), generate_ai_brainstorm(), generate_ai_summary(), get_statistics_accounts() (+22 more)

### Community 13 - "models.py"
Cohesion: 0.05
Nodes (73): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, get, root(), JobStatus, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable (+65 more)

### Community 14 - "User"
Cohesion: 0.10
Nodes (36): User, bulk_action(), delete_account(), get_account_briefing(), get_accounts(), delete, get, post (+28 more)

### Community 15 - "GeminiService"
Cohesion: 0.12
Nodes (19): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 17 - "api.ts"
Cohesion: 0.07
Nodes (29): DELIVERABLE_STATUS_COLORS, PAYMENT_STATUS_BADGES, KolCampaignsPage(), formatNumberToRupiahString(), getTerbilangShort(), parseRupiahStringToNumber(), RupiahInput(), RupiahInputProps (+21 more)

### Community 18 - "Session"
Cohesion: 0.13
Nodes (19): delete_queue_job(), _fallback_local_results(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks, delete, get (+11 more)

### Community 19 - "dashboard/page.tsx"
Cohesion: 0.50
Nodes (3): DashboardImageThumbnail(), DashboardPage(), getProxiedImageUrl()

### Community 20 - "InstagrapiService"
Cohesion: 0.21
Nodes (10): InstagrapiService, Any, Session, Instagrapi Service — Instagram Private API Integration for Competitor Spy Uses…, Fetch competitor profile information from Instagram., Fetch recent posts for a competitor, calculate engagement rate, top hashtags,…, Fetch saved Instagram session from global settings table., Initializes an instagrapi Client with session settings. Supports sessionid… (+2 more)

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

### Community 27 - "fetchApi"
Cohesion: 0.09
Nodes (26): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, ActiveTab, AddJobState, Competitor, CompetitorPost (+18 more)

### Community 28 - "auth.ts"
Cohesion: 0.21
Nodes (9): jsonLd, metadata, AuthProvider(), Providers(), getIdToken(), onAuthChange(), auth, firebaseConfig (+1 more)

### Community 29 - "queue/page.tsx"
Cohesion: 0.19
Nodes (12): isDatePast(), LocalPost, LocalPostStatus, PfPost, PfResult, PLATFORM_COLORS, PLATFORM_ICONS, QueuePage() (+4 more)

### Community 30 - "YTPlayer"
Cohesion: 0.17
Nodes (7): AgentHealth, ClipResult, JobStatus, ManualSegment, Window, YtClipperPage(), YTPlayer

### Community 31 - "Components"
Cohesion: 0.06
Nodes (31): Brand & Accent, Buttons, Collapsing Strategy, Colors, Components, Date Picker, Elevation, Font Family (+23 more)

### Community 33 - "MetaAdapter"
Cohesion: 0.14
Nodes (7): MetaAdapter, Any, Adapter for Meta Graph API (Instagram Business API & Facebook Page API).…, Publishes post to Instagram Business via Graph API container flow., Publishes post to Facebook Page via Graph API., Exchanges OAuth auth code for short-lived access token, then long-lived access…, Fetches connected Facebook Pages and associated Instagram Business Accounts.

### Community 34 - "3. Routers & Endpoints (Backend)"
Cohesion: 0.09
Nodes (22): 1. Configuration & Models (Backend), 2. PostForMe Service & Queue Engine (Backend), 3. Routers & Endpoints (Backend), 4. Frontend UI Rework, Automated Tests, Implementation Plan - PostForMe API Integration & Full Platform Overhaul, Manual Verification, [MODIFY] [accounts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/accounts.py) (+14 more)

### Community 35 - "clear_all_activity_logs"
Cohesion: 0.25
Nodes (9): clear_all_activity_logs(), delete_activity_log(), get_activity_logs(), delete, get, Session, Retrieves chronological activity audit logs., Deletes a specific activity log entry. (+1 more)

### Community 36 - "app/page.tsx"
Cohesion: 0.22
Nodes (6): CATEGORIES, FAQS, FEATURES, LandingHomePage(), PRICING_PLANS, TARGET_AUDIENCE

### Community 37 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 38 - "services"
Cohesion: 0.22
Nodes (8): entrypoint, root, framework, root, rewrites, services, backend, frontend

### Community 39 - "server.js"
Cohesion: 0.33
Nodes (5): app, { createServer }, handle, next, { parse }

### Community 40 - "create_workspace"
Cohesion: 0.25
Nodes (9): create_workspace(), get_workspaces(), get, post, Session, Onboarding endpoint — creates the first workspace for a new user. Validates…, Lists workspaces belonging to the authenticated user (via WorkspaceMember).…, Creates a new Workspace and adds the creator as OWNER member. (+1 more)

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

### Community 49 - "useConfirmStore.ts"
Cohesion: 0.47
Nodes (4): GlobalGlassConfirmModal(), ConfirmOptions, ConfirmState, useConfirmStore

### Community 62 - "calendar.py"
Cohesion: 0.18
Nodes (17): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, BaseModel, datetime, get (+9 more)

## Knowledge Gaps
- **289 isolated node(s):** `DELIVERABLE_STATUS_COLORS`, `PAYMENT_STATUS_BADGES`, `DELIVERABLE_STATUS_BADGES`, `DeliverableAddModalProps`, `Settings` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UserSubscription`, `competitors.py`, `ActivityLog`, `create_workspace`, `database.py`, `statistics.py`, `models.py`, `Session`, `calendar.py`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `database.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Setting` connect `UserSubscription` to `InstagrapiService`, `models.py`, `GeminiService`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DELIVERABLE_STATUS_COLORS`, `PAYMENT_STATUS_BADGES`, `DELIVERABLE_STATUS_BADGES` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._