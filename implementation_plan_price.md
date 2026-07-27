# AgencyOS — Account Management, Firebase Auth, Stripe Billing & Admin Settings

## Overview

Implementasi sistem manajemen akun lengkap untuk AgencyOS: **Google login via Firebase**, **4 paket langganan dengan Stripe (sandbox)**, **admin panel** untuk mengatur harga & API keys, dan **alur posting yang terbatas sesuai paket user**.

Saat ini app sudah memiliki UI dashboard, Sidebar, Header, serta backend FastAPI dengan SQLAlchemy + Supabase PostgreSQL. Tidak ada auth sama sekali — semua dibuka tanpa login. Kita akan **menambahkan lapisan auth + billing di atas yang sudah ada** tanpa merusak fungsionalitas existing.

---

## User Review Required

> [!IMPORTANT]
> **Firebase Config** sudah disediakan user — akan dipakai di frontend untuk Google OAuth. Backend akan **memverifikasi Firebase ID Token** (bukan minta password sendiri).

> [!IMPORTANT]
> **Stripe Sandbox Mode** — semua payment key adalah test key. User perlu menyediakan:
> - `STRIPE_SECRET_KEY` (test key, `sk_test_...`)
> - `STRIPE_WEBHOOK_SECRET` (`whsec_...`)
> - `STRIPE_PUBLISHABLE_KEY` (untuk frontend, `pk_test_...`)
>
> Stripe Price IDs akan dibuat otomatis saat seed/setup, atau bisa diatur manual dari Admin Settings.

> [!WARNING]
> **Admin user** ditentukan dengan hardcode email `myudi422@gmail.com`. Admin mendapat akses tak terbatas dan bisa mengatur semua settings termasuk harga paket.

> [!CAUTION]
> Login Google **wajib** — tidak ada akses ke dashboard tanpa login. AppLayout akan redirect ke `/login` jika tidak terautentikasi.

---

## Pricing Plan (Rekomendasi)

Biaya API (PostForMe): **$10 per 1.000 post sukses** = $0.01/post

| Paket | Nama | Harga | Post/Bulan | Biaya API | Margin | Fitur |
|-------|------|-------|-----------|-----------|--------|-------|
| 🆓 Trial | **Starter Trial** | **$3** (3 hari) | 6 posts (2/hari) | ~$0.06 | ~99% | Basic posting, 1 akun, semua platform |
| 💼 Basic | **Creator** | **$19/bln** | 100 posts | $1.00 | ~95% | 3 akun sosmed, scheduling, media library |
| 🚀 Pro | **Agency** | **$49/bln** | 400 posts | $4.00 | ~92% | 10 akun, multi-client, analytics, queue engine |
| 🏢 Enterprise | **Studio** | **$99/bln** | 1.000 posts | $10.00 | ~90% | Unlimited akun, white-label, priority support, API access |

**Alasan pricing:**
- Trial $3 → barrier rendah, user coba dulu, 3 hari (6 min posts)
- Creator $19 → sweet spot untuk freelancer/konten kreator individu
- Agency $49 → untuk agensi kecil, multi-client = nilai utama
- Studio $99 → untuk agensi besar, ROI jelas vs hiring staff

---

## Open Questions

> [!NOTE]
> Apakah setelah trial habis, user **otomatis locked** (tidak bisa buat post baru) sampai upgrade? → **Ya, ini rencana default.**

> [!NOTE]
> Apakah user bisa **downgrade** paket? → Tidak diimplementasi di MVP, hanya upgrade.

> [!NOTE]
> Webhook Stripe: perlu endpoint publik (bisa pakai `stripe listen --forward-to` untuk dev lokal, atau Vercel URL untuk production).

---

## Proposed Changes

### Component: Firebase Auth (Frontend)

#### [NEW] `frontend/src/lib/firebase.ts`
Inisialisasi Firebase app dengan config yang diberikan user. Export `auth` dan `googleProvider`.

#### [NEW] `frontend/src/lib/auth.ts`
Helper functions: `signInWithGoogle()`, `signOut()`, `getCurrentUser()`, `getIdToken()`.

#### [NEW] `frontend/src/store/authStore.ts`
Zustand store untuk state auth: `user`, `isAdmin`, `subscription`, `isLoading`, `isAuthenticated`.

#### [MODIFY] `frontend/src/lib/api.ts`
Tambahkan Firebase ID Token ke setiap request header: `Authorization: Bearer <firebase_id_token>`.

#### [NEW] `frontend/src/app/login/page.tsx`
Halaman login dengan Google OAuth. Beautiful UI dengan branding AgencyOS. Redirect ke `/` setelah login berhasil.

#### [MODIFY] `frontend/src/components/layout/AppLayout.tsx`
Tambahkan auth guard: cek `isAuthenticated` dari authStore. Jika belum login → redirect ke `/login`. Jika sudah login tapi belum subscribe & bukan admin → tampilkan pricing overlay/modal.

#### [MODIFY] `frontend/src/components/layout/Sidebar.tsx`
- Tampilkan info user (avatar Google, nama, email)
- Tampilkan badge paket aktif (Trial/Creator/Agency/Studio)
- Tambah link **"Admin Settings"** (hanya muncul jika `isAdmin`)
- Tampilkan post quota usage (misal: 45/100 posts used)
- Tombol upgrade plan
- Tombol logout

#### [NEW] `frontend/src/app/pricing/page.tsx`
Halaman pricing public (bisa diakses tanpa login juga). Tampilkan 4 paket, CTA subscribe dengan Stripe Checkout. Animasi premium.

#### [NEW] `frontend/src/app/admin/page.tsx`
Admin Settings Panel — hanya bisa diakses jika email = `myudi422@gmail.com`:
- **Pricing Settings**: Edit harga & post limit tiap paket (save ke DB)
- **API Keys**: Edit `POSTFORME_API_KEY`, Stripe keys, dll (save ke Settings table)
- **User Management**: List semua user, lihat paket, manual override subscription
- **Stripe Webhook Logs**: Recent webhook events
- **System Config**: Toggle `USE_MOCK_SERVICES`, dll

#### [NEW] `frontend/src/components/billing/SubscriptionGuard.tsx`
HOC/Wrapper yang cek apakah user punya subscription aktif. Jika tidak (dan bukan admin) → show upgrade modal. Dipakai di `AppLayout`.

#### [NEW] `frontend/src/components/billing/PostQuotaGuard.tsx`
Cek sebelum submit post: apakah user masih punya quota post tersisa? Jika habis → show "Upgrade Plan" dialog.

---

### Component: Firebase Auth (Backend)

#### [NEW] `backend/routers/firebase_auth.py`
Router `/auth/firebase/verify`:
- Terima `id_token` dari Firebase
- Verifikasi token dengan Firebase Admin SDK (atau verifikasi manual via Google public keys)
- Lookup/create user di DB berdasarkan email
- Return user data + subscription info + is_admin flag

#### [NEW] `backend/routers/billing.py`
Router `/billing/`:
- `GET /billing/plans` → list semua plan (dari DB settings)
- `POST /billing/checkout` → buat Stripe Checkout Session → return `checkout_url`
- `POST /billing/webhook` → handle Stripe webhooks (payment_intent.succeeded, subscription events)
- `GET /billing/subscription` → get user's current subscription
- `POST /billing/cancel` → cancel subscription

#### [MODIFY] `backend/models/models.py`
Tambahkan models baru:
- **`SubscriptionPlan`** — nama, harga, post_limit, duration_days, stripe_price_id, is_active
- **`UserSubscription`** — user_id, plan_id, status (active/trial/expired/cancelled), posts_used, posts_limit, started_at, expires_at, stripe_subscription_id
- **`UserProfile`** → extend `User` model: tambahkan `firebase_uid`, `is_admin`, `google_avatar_url`
- **`AppSettings`** → key-value store global (untuk admin config, sudah ada `Setting` tapi perlu diperluas)

#### [MODIFY] `backend/routers/posts.py`
Tambahkan quota check: sebelum publish post, cek `UserSubscription.posts_used < posts_limit`. Increment `posts_used` setelah post sukses (via webhook atau direct). Jika quota habis → return 402 Payment Required.

#### [NEW] `backend/services/stripe_service.py`
- `create_checkout_session(user_email, plan_id)` → Stripe Checkout
- `handle_webhook(payload, sig_header)` → process webhook events
- `get_subscription(stripe_subscription_id)` → check status

#### [NEW] `backend/services/firebase_service.py`
- `verify_id_token(id_token)` → verifikasi Firebase token via Google API
- `get_or_create_user(firebase_user)` → upsert user di DB

#### [MODIFY] `backend/config.py`
Tambahkan:
- `FIREBASE_PROJECT_ID` (untuk verify tokens)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL = "myudi422@gmail.com"`

#### [MODIFY] `backend/requirements.txt`
Tambahkan: `stripe>=8.0.0`, `firebase-admin>=6.0.0`

#### [NEW] `backend/routers/admin.py`
Admin-only router `/admin/`:
- `GET /admin/users` → list semua users + subscriptions
- `PUT /admin/plans/{plan_id}` → update plan pricing
- `GET /admin/settings` → list semua app settings
- `PUT /admin/settings` → update settings (API keys, dll)
- `POST /admin/users/{user_id}/override-subscription` → manual override

#### [MODIFY] `backend/main.py`
Register routers baru: `firebase_auth`, `billing`, `admin`.

#### [NEW] `backend/seed_plans.py`
Seed 4 subscription plans ke DB dengan pricing yang sudah ditentukan.

---

## Alur Lengkap (Flow)

```
User buka app
  → Belum login → redirect /login
  → Login Google → Firebase ID Token dikirim ke backend
  → Backend verify token → lookup/create user di DB
  → Return user + subscription status
  → Jika trial/no-subscription → tampilkan pricing page overlay
  → User pilih plan → Stripe Checkout (sandbox)
  → Stripe webhook → activate subscription di DB
  → User bisa akses dashboard sesuai quota

User buat post:
  → Frontend cek quota sisa
  → Jika ada quota → submit post
  → Backend verify quota sebelum publish
  → Setelah publish sukses → increment posts_used
  → Jika posts_used >= posts_limit → 402, suruh upgrade

Admin (myudi422@gmail.com):
  → Skip quota check
  → Akses /admin/settings
  → Bisa edit harga plan, API keys, dll
  → Bisa override user subscription
```

---

## Verification Plan

### Automated Tests
- `GET /auth/firebase/verify` dengan valid Firebase token → return user data
- `GET /billing/plans` → return 4 plans dengan harga yang benar
- `POST /billing/checkout` → return Stripe checkout URL
- Post creation dengan quota habis → return 402

### Manual Verification
1. Buka app → redirect ke `/login` ✓
2. Klik "Login with Google" → Firebase OAuth ✓
3. Login sebagai admin → akses `/admin` ✓
4. Login sebagai user baru → lihat pricing overlay ✓
5. Pilih Trial Plan → Stripe Checkout sandbox ✓
6. Complete payment (test card) → subscription aktif ✓
7. Buat post → posts_used increment ✓
8. Habiskan quota → lihat upgrade modal ✓

---

## Future Improvements (Task List for AI)

Ini task list untuk improvement kedepan agar AI tidak perlu re-research:

- [ ] **Stripe Customer Portal** → user bisa manage/cancel subscription sendiri
- [ ] **Email Notifications** → welcome email, quota warning (80%), quota habis
- [ ] **Annual billing discount** → diskon 20% jika bayar tahunan
- [ ] **Referral system** → user dapat extra 50 posts per referral
- [ ] **Usage analytics** → grafik post usage per hari/bulan di dashboard
- [ ] **Team seats** → Agency & Studio plan bisa invite team members
- [ ] **Webhook retry** → jika Stripe webhook gagal, auto-retry dengan exponential backoff
- [ ] **Subscription pause** → user bisa pause subscription 1x per period
- [ ] **Promo codes** → Stripe coupon integration
- [ ] **Invoice history** → list Stripe invoices di user profile
- [ ] **Platform-specific quota** → quota per platform (Instagram, TikTok, dll)
- [ ] **Auto-renewal warning** → notifikasi 3 hari sebelum renewal
- [ ] **Grace period** → 3 hari grace setelah subscription expire sebelum benar-benar locked
