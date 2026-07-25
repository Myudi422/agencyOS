# Implementation Plan - PostForMe API Integration & Full Platform Overhaul

Rearchitect AgencyOS backend and frontend to use the **PostForMe API** (`api.postforme.dev`) instead of `aiogram` / `instagrapi` / direct Meta Graph API. This enables unified publishing, account connection, post scheduling, previewing, and analytics across 10 social platforms: **Instagram, Facebook, X (Twitter), TikTok, TikTok Business, YouTube, Pinterest, LinkedIn, Bluesky, and Threads**.

## User Review Required

> [!IMPORTANT]
> - All social media publishing, OAuth authorization, media upload signing, and account syncing will now run through **PostForMe API** (`api.postforme.dev`).
> - Provide your `POSTFORME_API_KEY` in `backend/.env.local` or environment. A default fallback / test setup will be configured so local execution operates seamlessly.
> - Legacy `instagrapi` session cookie login and direct Meta Graph API routes are replaced with PostForMe OAuth Auth URL generation (`/v1/social-accounts/auth-url`) and PostForMe account management.

## Open Questions

> [!NOTE]
> None. The OpenAPI specification for PostForMe is fully documented in `api-1.json` at the root of the workspace.

## Proposed Changes

### 1. Configuration & Models (Backend)

#### [MODIFY] [config.py](file:///d:/CODING/agencyOs/agencyOS/backend/config.py)
- Add `POSTFORME_API_KEY` and `POSTFORME_BASE_URL` ("https://api.postforme.dev").

#### [MODIFY] [.env.local](file:///d:/CODING/agencyOs/agencyOS/backend/.env.local)
- Add `POSTFORME_API_KEY`.

#### [MODIFY] [models.py](file:///d:/CODING/agencyOs/agencyOS/backend/models/models.py)
- Expand `AccountPlatform` enum to support all 10 PostForMe platforms:
  `facebook`, `instagram`, `x`, `tiktok`, `tiktok_business`, `youtube`, `pinterest`, `linkedin`, `bluesky`, `threads` (plus fallback aliases `instagram_business`, `facebook_page`).
- Add `platform_configurations` JSON column to `Post` model for platform-specific post options.
- Add `postforme_post_id` column to `Post` and `postforme_account_id` to `SocialAccount`.

---

### 2. PostForMe Service & Queue Engine (Backend)

#### [NEW] [postforme_service.py](file:///d:/CODING/agencyOs/agencyOS/backend/services/postforme_service.py)
- Implement `PostForMeService` using `httpx` async client to interact with PostForMe endpoints:
  - `create_upload_url(content_type)`: `/v1/media/create-upload-url`
  - `generate_auth_url(platform, platform_data, external_id, redirect_url_override, permissions)`: `/v1/social-accounts/auth-url`
  - `get_social_accounts(platform, username, external_id, status)`: `/v1/social-accounts`
  - `create_social_account(...)`: `/v1/social-accounts`
  - `disconnect_social_account(id)`: `/v1/social-accounts/{id}/disconnect`
  - `delete_social_account(id)`: `/v1/social-accounts/{id}`
  - `create_post(caption, social_accounts, scheduled_at, is_draft, external_id, media, platform_configurations)`: `/v1/social-posts`
  - `get_posts(...)`: `/v1/social-posts`
  - `get_post_results(post_id)`: `/v1/social-post-results`
  - `get_account_feed(account_id)`: `/v1/social-account-feeds/{social_account_id}`

#### [MODIFY] [queue_service.py](file:///d:/CODING/agencyOs/agencyOS/backend/services/queue_service.py)
- Replace legacy `instagrapi` and `meta_adapter` publishing loops with `postforme_service.create_post(...)`.

---

### 3. Routers & Endpoints (Backend)

#### [MODIFY] [auth.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/auth.py)
- Add `/auth/postforme/auth-url` endpoint to generate OAuth connect URLs for all 10 social platforms.
- Add `/auth/postforme/connect-bluesky` for Bluesky handle & app password auth.

#### [MODIFY] [accounts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/accounts.py)
- Support fetching and syncing accounts from PostForMe.
- Support filtering by all 10 platforms.

#### [MODIFY] [posts.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/posts.py)
- Support platform configurations for all 10 platforms in post creation schema (`PostCreate`).
- Forward post creation requests to PostForMe API.

#### [MODIFY] [media.py](file:///d:/CODING/agencyOs/agencyOS/backend/routers/media.py)
- Support direct upload to PostForMe via signed URLs.

---

### 4. Frontend UI Rework

#### [MODIFY] [page.tsx](file:///d:/CODING/agencyOs/agencyOS/frontend/src/app/accounts/page.tsx)
- Redesign Social Accounts Management UI to support all 10 platforms (Facebook, Instagram, X, TikTok, TikTok Business, YouTube, Pinterest, LinkedIn, Bluesky, Threads).
- New modal "Connect Social Account" with platform selector cards and OAuth/credential triggers.
- Updated platform badge icons, status filters, and brand color highlights for all platforms.

#### [MODIFY] [PostComposerModal.tsx](file:///d:/CODING/agencyOs/agencyOS/frontend/src/components/posts/PostComposerModal.tsx)
- Add target account selection with icons/badges for all 10 platforms.
- Add platform-specific configuration tabs & inputs:
  - **Instagram**: Placement (Timeline, Reels, Stories), Audio Name, User Tags
  - **Facebook**: Placement (Timeline, Reels, Stories), Location ID
  - **TikTok / TikTok Business**: Privacy level, Disable duet/stitch/comments, Video cover timestamp
  - **YouTube**: Title, Description, Privacy status (public, private, unlisted), License, Made For Kids, Synthetic media
  - **Pinterest**: Pin Title, Link URL, Board ID
  - **X (Twitter)**: Poll choices and duration
  - **LinkedIn**: Connection type, Reshare Post ID
  - **Threads**: Placement (Timeline, Reels)
  - **Bluesky**: Custom caption override
- Live multi-platform preview switcher.

---

## Verification Plan

### Automated Tests
- Test PostForMe API service calls via FastAPI endpoints (Swagger `/docs`).
- Test account auth URL generation (`POST /auth/postforme/auth-url`).
- Test post creation with platform configurations (`POST /posts/`).

### Manual Verification
- Launch backend with `uvicorn main:app --reload`.
- Launch frontend with `bun run dev`.
- Verify the new Connect Account modal in `/accounts` for all 10 platforms.
- Verify PostComposer modal with platform-specific options for YouTube, TikTok, X, Instagram, Facebook, Pinterest, LinkedIn, Bluesky, Threads.
