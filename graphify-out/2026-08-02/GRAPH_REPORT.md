# Graph Report - agencyOS  (2026-08-02)

## Corpus Check
- 130 files · ~752,432 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1295 nodes · 2984 edges · 62 communities (48 shown, 14 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 378 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `24c5d858`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserSubscription
- competitors.py
- User
- yt_clipper_agent.py
- statistics/page.tsx
- PostForMeService
- statistics.py
- media.py
- fetchApi
- database.py
- useStore
- useAuthStore
- get_calendar_posts
- models.py
- get_user_workspace
- GeminiService
- compilerOptions
- kol-campaigns/page.tsx
- Session
- queue.py
- InstagrapiService
- useToastStore.ts
- Component: Firebase Auth (Backend)
- devDependencies
- Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center
- midtrans_service.py
- dependencies
- competitor-spy/page.tsx
- auth.ts
- queue/page.tsx
- YTPlayer
- Components
- postforme_webhook
- MetaAdapter
- 3. Routers & Endpoints (Backend)
- clear_all_activity_logs
- app/page.tsx
- package.json
- services
- server.js
- dashboard/page.tsx
- AgencyOS Backend Documentation
- 🚀 AgencyOS Server Upscaling & Load Management Guide (`load.md`)
- migrate_kol_stats.py
- 🛠️ 2. Komponen Teknis Terimplementasi
- AgencyOS - Enterprise Digital Agency Social Management Platform
- rules/graphify.md
- workflows/graphify.md
- [token]/page.tsx
- GlobalGlassConfirmModal.tsx
- date-fns
- firebase
- next.config.js
- next-env.d.ts
- html2canvas
- next
- react
- tailwind-merge
- zustand

## God Nodes (most connected - your core abstractions)
1. `User` - 141 edges
2. `ActivityLog` - 57 edges
3. `fetchApi()` - 56 edges
4. `SocialAccount` - 53 edges
5. `useStore` - 42 edges
6. `WorkspaceMember` - 38 edges
7. `Workspace` - 37 edges
8. `AccountPlatform` - 31 edges
9. `get_user_workspace()` - 30 edges
10. `useAuthStore` - 29 edges

## Surprising Connections (you probably didn't know these)
- `FirebaseVerifyRequest` --uses--> `RoleEnum`  [INFERRED]
  backend/routers/firebase_auth.py → backend/models/models.py
- `AccountBriefingSchema` --uses--> `AccountPlatform`  [INFERRED]
  backend/routers/accounts.py → backend/models/models.py
- `BulkActionRequest` --uses--> `AccountPlatform`  [INFERRED]
  backend/routers/accounts.py → backend/models/models.py
- `AddCompetitorRequest` --uses--> `AccountPlatform`  [INFERRED]
  backend/routers/competitors.py → backend/models/models.py
- `CompetitorResponse` --uses--> `AccountPlatform`  [INFERRED]
  backend/routers/competitors.py → backend/models/models.py

## Import Cycles
- None detected.

## Communities (62 total, 14 thin omitted)

### Community 0 - "UserSubscription"
Cohesion: 0.06
Nodes (77): PlanTier, Paket langganan — semua plan unlimited akun sosmed, beda di quota post., Subscription aktif milik satu user., Menyimpan OTP WhatsApp sementara untuk verifikasi sebelum claim trial., Setting, SubscriptionPlan, SubscriptionStatus, UserSubscription (+69 more)

### Community 1 - "competitors.py"
Cohesion: 0.07
Nodes (69): CompetitorAccount, CompetitorPost, Reset Competitor Data Script Deletes all records from competitor_posts and…, reset_competitors(), add_competitor(), AddCompetitorRequest, CompetitorResponse, delete_competitor() (+61 more)

### Community 2 - "User"
Cohesion: 0.07
Nodes (113): AccountPlatform, Client, KolCampaign, KolCampaignKol, KolCampaignStatus, KolDeliverable, KolDeliverableStatus, KolDeliverableType (+105 more)

### Community 3 - "yt_clipper_agent.py"
Cohesion: 0.06
Nodes (58): check_dependency(), check_has_audio(), check_python_package(), ClipRequest, delete_clip(), delete_generated_image(), extract_youtube_heatmap(), fetch_heatmap_analysis() (+50 more)

### Community 4 - "statistics/page.tsx"
Cohesion: 0.06
Nodes (39): AccountMetrics, AccountSummary, CHART_COLORS, CustomTooltip(), DailyData, FeedPost, fmtDate(), fmtDayShort() (+31 more)

### Community 5 - "PostForMeService"
Cohesion: 0.09
Nodes (22): PostForMeService, Any, Get connected social accounts from PostForMe. Endpoint: GET /v1/social-accounts, Manually register or update a social account in PostForMe. Endpoint: POST…, Disconnect a social account in PostForMe. Endpoint: POST /v1/social-…, Delete a social account in PostForMe. Endpoint: DELETE /v1/social-accounts/{id}, Create a post across multi-platform social accounts in PostForMe. Endpoint:…, Delete a post from PostForMe. Endpoint: DELETE /v1/social-posts/{id} (+14 more)

### Community 6 - "statistics.py"
Cohesion: 0.52
Nodes (6): AccountStatus, AIBrainstormRequest, AISummaryRequest, ChatItem, BaseModel, Statistics Router — Shiera Analytics Fetches social account feed + metrics from…

### Community 7 - "media.py"
Cohesion: 0.08
Nodes (33): Media, bulk_delete_media(), bulk_move_media(), BulkDeleteRequest, BulkMoveRequest, delete_folder(), delete_media(), get_media_items() (+25 more)

### Community 8 - "fetchApi"
Cohesion: 0.09
Nodes (28): AdminPage(), TabType, TIER_COLORS, TIER_ICONS, BillingSuccessContent(), dynamic, CalendarImageThumbnail(), CalendarPage() (+20 more)

### Community 9 - "database.py"
Cohesion: 0.05
Nodes (24): Settings, get_db(), get, root(), Migration Script: Add briefing column to social_accounts table, Migration Script: Add social_account_id column to competitor_accounts table, Database Migration Script — Migrate database schema from Stripe to Midtrans.…, Migration Script: Create KOL Campaign & Deliverable Tracker tables (+16 more)

### Community 10 - "useStore"
Cohesion: 0.13
Nodes (21): AccountsPage(), dynamic, PLATFORMS_CONFIG, ActivityPage(), OAuthCallbackHandler(), ClientsPage(), MediaPage(), GlassConfirmModal() (+13 more)

### Community 11 - "useAuthStore"
Cohesion: 0.14
Nodes (22): LoginPage(), SubscriptionGuard(), TIER_META, PUBLIC_SPLASH_PATHS, SplashScreen(), AppLayout(), PUBLIC_PATHS, Header() (+14 more)

### Community 12 - "get_calendar_posts"
Cohesion: 0.07
Nodes (44): _ensure_utc(), get_calendar_posts(), _in_range(), _parse_and_ensure_utc(), Any, datetime, get, put (+36 more)

### Community 13 - "models.py"
Cohesion: 0.15
Nodes (33): ActivityLog, Post, PostStatus, PostTarget, PostType, SocialAccount, BaseModel, RescheduleRequest (+25 more)

### Community 14 - "get_user_workspace"
Cohesion: 0.11
Nodes (30): AccountBriefingSchema, bulk_action(), BulkActionRequest, delete_account(), get_account_briefing(), get_accounts(), BaseModel, delete (+22 more)

### Community 15 - "GeminiService"
Cohesion: 0.12
Nodes (19): generate_otp(), normalize_phone(), Fonnte WhatsApp OTP Service Mengirim kode OTP via WhatsApp menggunakan Fonnte…, Generate OTP numerik acak., Normalisasi nomor WA ke format internasional tanpa '+'. Contoh: '08123456789' →…, Kirim OTP ke nomor WhatsApp via Fonnte API. Args: phone: Nomor WA (format…, Kirim pesan notifikasi umum via Fonnte WhatsApp API., send_otp_whatsapp() (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 17 - "kol-campaigns/page.tsx"
Cohesion: 0.12
Nodes (16): KolCampaignsPage(), CampaignCard(), CampaignCardProps, CampaignItem, STATUS_BADGES, CampaignCreateModalProps, AccountItem, KolAccountSelector() (+8 more)

### Community 18 - "Session"
Cohesion: 0.11
Nodes (23): cancel_postforme_post(), delete_queue_job(), _fallback_local_results(), get_postforme_posts(), get_postforme_results(), get_publish_history(), get_queue_status(), BackgroundTasks (+15 more)

### Community 19 - "queue.py"
Cohesion: 0.13
Nodes (18): Script perbaikan langsung: Ambil hasil dari PostForMe API untuk semua post yang…, JobStatus, PostPublishResult, PublishJob, Menyimpan hasil aktual publish dari PostForMe API (/v1/social-post-results).…, _process_post_result_event(), Webhook handler untuk menerima event dari PostForMe API. PostForMe mengirim…, Background task: Proses event social.post.result.created. Update status… (+10 more)

### Community 20 - "InstagrapiService"
Cohesion: 0.21
Nodes (10): InstagrapiService, Any, Session, Instagrapi Service — Instagram Private API Integration for Competitor Spy Uses…, Fetch competitor profile information from Instagram., Fetch recent posts for a competitor, calculate engagement rate, top hashtags,…, Fetch saved Instagram session from global settings table., Initializes an instagrapi Client with session settings. Supports sessionid… (+2 more)

### Community 21 - "useToastStore.ts"
Cohesion: 0.15
Nodes (11): OnboardingPage(), AccountBriefingModal(), AccountBriefingModalProps, DEFAULT_PILLARS, GlassToastManager(), PLATFORM_BADGES, PostComposerModal(), toast (+3 more)

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

### Community 32 - "postforme_webhook"
Cohesion: 0.18
Nodes (12): list_postforme_webhooks(), postforme_webhook(), BackgroundTasks, get, post, Request, Menerima event dari PostForMe API. PostForMe mengirim POST request dengan: -…, Setup / daftarkan webhook ke PostForMe secara otomatis. Panggil endpoint ini… (+4 more)

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

### Community 40 - "dashboard/page.tsx"
Cohesion: 0.50
Nodes (3): DashboardImageThumbnail(), DashboardPage(), getProxiedImageUrl()

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

## Knowledge Gaps
- **288 isolated node(s):** `Settings`, `nextConfig`, `name`, `version`, `private` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UserSubscription`, `competitors.py`, `statistics.py`, `database.py`, `get_calendar_posts`, `models.py`, `get_user_workspace`, `Session`, `queue.py`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `PostForMeService` connect `PostForMeService` to `queue.py`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `fetchApi()` connect `fetchApi` to `statistics/page.tsx`, `dashboard/page.tsx`, `useStore`, `useAuthStore`, `kol-campaigns/page.tsx`, `useToastStore.ts`, `competitor-spy/page.tsx`, `queue/page.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 42 inferred relationships involving `User` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`User` has 42 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `ActivityLog` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`ActivityLog` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `SocialAccount` (e.g. with `AccountBriefingSchema` and `BulkActionRequest`) actually correct?**
  _`SocialAccount` has 33 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `nextConfig`, `name` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._