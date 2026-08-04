from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
import json

from backend.database import get_db
from backend.models.models import User, Workspace, WorkspaceMember, Client, SocialAccount, AccountPlatform, AccountStatus, RoleEnum, ActivityLog
from backend.services.meta_adapter import meta_adapter
from backend.services.instagrapi_service import instagrapi_service
from backend.config import settings
from backend.routers.firebase_auth import require_user, get_user_workspace, get_current_user_from_token

logger = logging.getLogger("AuthRouter")

router = APIRouter(prefix="/auth", tags=["Auth"])

class CookieLoginRequest(BaseModel):
    sessionid: str
    username: Optional[str] = None
    workspace_id: Optional[str] = None
    client_id: Optional[str] = None

class CredentialLoginRequest(BaseModel):
    username: str
    password: str
    workspace_id: Optional[str] = None
    client_id: Optional[str] = None

class ChallengeResolveRequest(BaseModel):
    username: str
    code: str
    workspace_id: Optional[str] = None
    client_id: Optional[str] = None

class PostForMeAuthUrlRequest(BaseModel):
    platform: str
    workspace_id: Optional[str] = None
    client_id: Optional[str] = None
    platform_data: Optional[Dict[str, Any]] = None
    permissions: Optional[List[str]] = None

class BlueskyConnectRequest(BaseModel):
    handle: str
    app_password: str
    workspace_id: Optional[str] = None
    client_id: Optional[str] = None

def _get_user_target_workspace(
    db: Session,
    current_user: Optional[User],
    workspace_id: Optional[str],
    client_id: Optional[str]
):
    """
    Returns (workspace, client) for the current user.
    Priority: explicit workspace_id (validated) > user's first workspace > create new.
    """
    target_ws = None
    if workspace_id and workspace_id != "ws-default":
        if current_user:
            if current_user.is_admin:
                target_ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
            else:
                member = db.query(WorkspaceMember).filter(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.user_id == current_user.id
                ).first()
                if member:
                    target_ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()

    if not target_ws and current_user:
        # Find user's own workspace
        membership = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == current_user.id
        ).first()
        if membership:
            target_ws = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()

    if not target_ws:
        if current_user:
            name_part = current_user.full_name.split()[0] if current_user.full_name else "My"
            target_ws = Workspace(
                name=f"{name_part}'s Workspace",
                slug=f"ws-{current_user.id[:8]}",
                timezone="Asia/Jakarta"
            )
        else:
            target_ws = Workspace(name="Main Agency Workspace", slug="main-agency", timezone="Asia/Jakarta")
        db.add(target_ws)
        db.flush()
        if current_user:
            db.add(WorkspaceMember(workspace_id=target_ws.id, user_id=current_user.id, role="owner"))

    # Resolve client
    target_client = None
    if client_id and client_id != "client-1":
        target_client = db.query(Client).filter(Client.id == client_id, Client.workspace_id == target_ws.id).first()
    if not target_client:
        target_client = db.query(Client).filter(Client.workspace_id == target_ws.id).first()
    if not target_client:
        target_client = Client(
            workspace_id=target_ws.id,
            name="Primary Client",
            description="Default client",
            brand_color="#6366f1",
            timezone="Asia/Jakarta"
        )
        db.add(target_client)
        db.flush()

    return target_ws, target_client

@router.post("/postforme/auth-url")
async def postforme_auth_url(
    req: PostForMeAuthUrlRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_from_token)
):
    """
    Generates OAuth authorization URL for any supported platform via PostForMe API:
    facebook, instagram, x, tiktok, tiktok_business, youtube, pinterest, linkedin, threads.

    NOTE: redirect_url_override is not passed to PostForMe — configure the callback URL
    in the PostForMe dashboard (Settings > Project Redirect URL).
    """
    try:
        from backend.services.postforme_service import postforme_service
        target_ws, _ = _get_user_target_workspace(db, current_user, req.workspace_id, req.client_id)

        try:
            # First attempt: tag account to this workspace via external_id
            res = await postforme_service.generate_auth_url(
                platform=req.platform,
                platform_data=req.platform_data,
                external_id=target_ws.id,
                permissions=req.permissions
            )
        except Exception as pf_err:
            err_str = str(pf_err).lower()
            # PostForMe returns "External Id already exists" when the OAuth account
            # was previously connected under a DIFFERENT external_id.
            # Fall back to connecting without external_id tagging.
            if (
                "external id already exists" in err_str
                or "external_id already exists" in err_str
                or "externalid" in err_str.replace("_", "").replace(" ", "")
                or "no valid accounts found" in err_str
                or ("external" in err_str and "exist" in err_str)
            ):
                logger.warning(
                    f"PostForMe external_id conflict for workspace {target_ws.id} "
                    f"({req.platform}). Retrying without external_id. Error: {pf_err}"
                )
                res = await postforme_service.generate_auth_url(
                    platform=req.platform,
                    platform_data=req.platform_data,
                    external_id=None,
                    permissions=req.permissions
                )
            else:
                raise
        return res
    except Exception as e:
        logger.error(f"PostForMe Auth URL error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to generate auth URL: {str(e)}")


class PostForMeSyncRequest(BaseModel):
    workspace_id: Optional[str] = None
    client_id: Optional[str] = None

def extract_followers_count(acc: dict) -> int:
    """
    Recursively search for follower / subscriber / fan counts in PostForMe account data or metadata.
    """
    target_keys = {
        "followers_count", "follower_count", "followerscount", "followercount",
        "followers", "follower", "subscribers_count", "subscriber_count",
        "subscriberscount", "subscribercount", "subscribers", "subscriber",
        "fan_count", "fancount", "fans", "follower_num", "subscribers_num"
    }

    def search_dict(d: Any) -> int:
        if isinstance(d, dict):
            for k, v in d.items():
                clean_k = str(k).lower().replace("_", "").replace("-", "")
                if clean_k in {tk.replace("_", "") for tk in target_keys}:
                    try:
                        if isinstance(v, (int, float)) and v > 0:
                            return int(v)
                        elif isinstance(v, str) and v.isdigit() and int(v) > 0:
                            return int(v)
                    except (ValueError, TypeError):
                        pass
                if isinstance(v, (dict, list)):
                    res = search_dict(v)
                    if res > 0:
                        return res
        elif isinstance(d, list):
            for item in d:
                res = search_dict(item)
                if res > 0:
                    return res
        return 0

    return search_dict(acc)


@router.post("/postforme/sync-accounts")
async def postforme_sync_accounts(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Fetch all social accounts from PostForMe API and sync them into local SocialAccount database records.
    Updates workspace_id, client_id, profile_photo_url, followers_count, and connection status.
    """
    workspace_id = payload.get("workspace_id")
    client_id = payload.get("client_id")
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required")

    target_ws = get_user_workspace(current_user, workspace_id, db)
    target_client = None
    if client_id:
        target_client = db.query(Client).filter(Client.id == client_id, Client.workspace_id == target_ws.id).first()
    if not target_client:
        target_client = db.query(Client).filter(Client.workspace_id == target_ws.id).first()
    if not target_client:
        # Create default client for workspace so accounts are always associated seamlessly
        try:
            target_client = Client(
                workspace_id=target_ws.id,
                name="Default Client",
                company_name=target_ws.name,
                email=current_user.email or "client@agencyos.local"
            )
            db.add(target_client)
            db.commit()
            db.refresh(target_client)
        except Exception:
            db.rollback()
            target_client = None

    try:
        from backend.services.postforme_service import postforme_service

        # Fetch active accounts from PostForMe project (max limit is 50/100 for PostForMe API)
        pf_res = await postforme_service.get_social_accounts(limit=50)
        pf_accounts = pf_res.get("data", [])

        target_account_id = payload.get("social_account_id")
        target_platform = payload.get("platform")

        synced_count = 0

        for acc in pf_accounts:
            pf_id = acc.get("id")
            if not pf_id:
                continue

            ext_id = acc.get("external_id")
            platform_str = acc.get("platform", "instagram").lower()
            raw_username = acc.get("username") or acc.get("name") or "user"
            username = str(raw_username).strip().lstrip("@")
            name = acc.get("name") or username
            profile_photo_url = acc.get("profile_photo_url")
            followers = extract_followers_count(acc)

            try:
                enum_platform = AccountPlatform(platform_str)
            except ValueError:
                enum_platform = AccountPlatform.INSTAGRAM

            # Check workspace ownership & authorization conditions:
            # 1. Already linked in local DB for target_ws (re-syncing existing active account)
            existing = db.query(SocialAccount).filter(
                SocialAccount.workspace_id == target_ws.id,
                (SocialAccount.postforme_account_id == pf_id) | (
                    (SocialAccount.platform == enum_platform) & (SocialAccount.username == username)
                )
            ).first()

            # 2. Explicitly targeted during OAuth callback session (newly connecting account)
            is_oauth_target = False
            if target_account_id:
                if pf_id == target_account_id:
                    is_oauth_target = True
            elif ext_id == target_ws.id:
                is_oauth_target = True
            elif target_platform and platform_str == target_platform.lower():
                target_username = payload.get("username")
                if target_username and username.lower() == str(target_username).strip().lstrip("@").lower():
                    is_oauth_target = True

            # STRICT MULTI-TENANCY FILTER:
            # Sync ONLY if account already exists in this workspace OR is explicitly targeted during OAuth connect!
            if not (existing or is_oauth_target):
                logger.info(f"Skipping unlinked/deleted account {pf_id} (@{username}) for workspace {target_ws.id}")
                continue

            # Match by postforme_account_id first, then by platform+username within THIS workspace only
            existing = db.query(SocialAccount).filter(
                SocialAccount.workspace_id == target_ws.id,
                SocialAccount.postforme_account_id == pf_id
            ).first()

            if not existing:
                existing = db.query(SocialAccount).filter(
                    SocialAccount.workspace_id == target_ws.id,
                    SocialAccount.platform == enum_platform,
                    SocialAccount.username == username
                ).first()

            if not existing:
                # Inherit briefing & watermark from sibling in another workspace if present
                sibling = db.query(SocialAccount).filter(
                    SocialAccount.platform == enum_platform,
                    SocialAccount.username == username
                ).first()

                existing = SocialAccount(
                    workspace_id=target_ws.id,
                    client_id=target_client.id,
                    platform=enum_platform,
                    platform_account_id=acc.get("user_id") or pf_id,
                    postforme_account_id=pf_id,
                    name=name,
                    username=username,
                    avatar_url=profile_photo_url or "",
                    access_token_encrypted="postforme_managed",
                    status=AccountStatus.CONNECTED,
                    followers_count=followers,
                    briefing=sibling.briefing if sibling else None,
                    watermark_config=sibling.watermark_config if sibling else None
                )
                db.add(existing)
            else:
                existing.postforme_account_id = pf_id
                existing.status = AccountStatus.CONNECTED
                if profile_photo_url:
                    existing.avatar_url = profile_photo_url
                if followers > 0:
                    existing.followers_count = followers
                existing.last_synced_at = datetime.utcnow()

            synced_count += 1

        db.commit()
        return {"status": "success", "synced_count": synced_count, "total_pf_accounts": len(pf_accounts)}
    except Exception as e:
        logger.error(f"PostForMe sync error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to sync accounts: {str(e)}")

@router.post("/postforme/connect-bluesky")
async def postforme_connect_bluesky(
    req: BlueskyConnectRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_from_token)
):
    """Connects Bluesky account using handle & app_password in PostForMe."""
    try:
        from backend.services.postforme_service import postforme_service
        handle_clean = req.handle.strip().lower().replace("@", "")

        target_ws, target_client = _get_user_target_workspace(db, current_user, req.workspace_id, req.client_id)

        acc_res = await postforme_service.create_social_account({
            "platform": "bluesky",
            "username": handle_clean,
            "platform_data": {
                "handle": handle_clean,
                "app_password": req.app_password
            }
        })

        pf_acc_id = acc_res.get("id") or f"spc_bluesky_{handle_clean}"

        acc = db.query(SocialAccount).filter(
            SocialAccount.workspace_id == target_ws.id,
            SocialAccount.platform == AccountPlatform.BLUESKY,
            SocialAccount.username == handle_clean
        ).first()

        if not acc:
            acc = SocialAccount(
                workspace_id=target_ws.id,
                client_id=target_client.id,
                platform=AccountPlatform.BLUESKY,
                platform_account_id=handle_clean,
                postforme_account_id=pf_acc_id,
                name=f"Bluesky (@{handle_clean})",
                username=handle_clean,
                avatar_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
                access_token_encrypted="postforme_managed",
                status=AccountStatus.CONNECTED,
                followers_count=1200
            )
            db.add(acc)
        else:
            acc.postforme_account_id = pf_acc_id
            acc.status = AccountStatus.CONNECTED

        db.commit()
        return {
            "status": "success",
            "message": f"Successfully connected Bluesky @{handle_clean} via PostForMe!",
            "account": {
                "id": pf_acc_id,
                "username": handle_clean,
                "platform": "bluesky"
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Bluesky Connect error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Bluesky Connection Failed: {str(e)}")

@router.post("/meta/connect")
async def meta_connect():
    """Generates Meta OAuth (Facebook + Instagram Business) login redirect URL."""
    auth_url = (
        f"https://www.facebook.com/{settings.META_API_VERSION}/dialog/oauth?"
        f"client_id={settings.META_CLIENT_ID}&"
        f"redirect_uri={settings.META_CALLBACK_URL}&"
        f"scope=public_profile,pages_show_list"
    )
    return {"url": auth_url, "callback_url": settings.META_CALLBACK_URL}

@router.post("/instagram/connect")
async def instagram_connect():
    """Generates Meta Business OAuth redirect URL for Instagram Business Accounts."""
    auth_url = (
        f"https://www.facebook.com/{settings.META_API_VERSION}/dialog/oauth?"
        f"client_id={settings.META_CLIENT_ID}&"
        f"redirect_uri={settings.META_CALLBACK_URL}&"
        f"scope=public_profile,pages_show_list"
    )
    return {"url": auth_url, "callback_url": settings.META_CALLBACK_URL}

@router.post("/instagram/cookie-login")
async def instagram_cookie_login(
    req: CookieLoginRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_from_token)
):
    """
    Connects Instagram Account directly using sessionid cookie via instagrapi.
    Preserves device fingerprint (uuids, device_settings) if account already exists.
    """
    try:
        # Check if existing account exists in DB to preserve device fingerprint
        existing_settings = None
        if req.username:
            clean_uname = req.username.strip().lower().replace("@", "")
            acc = db.query(SocialAccount).filter(
                SocialAccount.platform == AccountPlatform.INSTAGRAM_BUSINESS,
                SocialAccount.username == clean_uname
            ).first()
            if acc and acc.access_token_encrypted:
                try:
                    existing_settings = json.loads(meta_adapter.decrypt_token(acc.access_token_encrypted))
                    logger.info(f"Loaded existing device fingerprint settings for @{clean_uname}")
                except Exception as dec_err:
                    logger.warning(f"Could not decrypt existing token: {dec_err}")

        info = await instagrapi_service.connect_with_sessionid(
            req.sessionid,
            req.username,
            existing_settings=existing_settings
        )
        
        if req.username:
            expected_user = req.username.strip().lower().replace("@", "")
            actual_user = info["username"].lower()
            if expected_user != actual_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sessionid cookie yang Anda masukkan milik akun @{info['username']}, bukan @{req.username}! "
                           f"Buka Incognito Window di browser ➡️ login ke @{req.username} ➡️ salin sessionid untuk akun ini."
                )

        target_ws, target_client = _get_user_target_workspace(db, current_user, req.workspace_id, req.client_id)

        # Store session settings as JSON encrypted token
        session_json = json.dumps(info["session_settings"])
        encrypted_token = meta_adapter.encrypt_token(session_json)

        ig_acc = db.query(SocialAccount).filter(
            SocialAccount.workspace_id == target_ws.id,
            SocialAccount.platform == AccountPlatform.INSTAGRAM_BUSINESS,
            SocialAccount.username == info["username"]
        ).first()

        if not ig_acc:
            ig_acc = SocialAccount(
                workspace_id=target_ws.id,
                client_id=target_client.id,
                platform=AccountPlatform.INSTAGRAM_BUSINESS,
                platform_account_id=info["pk"],
                name=info["full_name"] or info["username"],
                username=info["username"],
                avatar_url=info["profile_pic_url"] or "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
                access_token_encrypted=encrypted_token,
                status=AccountStatus.CONNECTED,
                followers_count=info["follower_count"] or 1000
            )
            db.add(ig_acc)
        else:
            ig_acc.access_token_encrypted = encrypted_token
            ig_acc.status = AccountStatus.CONNECTED
            ig_acc.platform_account_id = info["pk"]

        log = ActivityLog(
            workspace_id=target_ws.id,
            action="CONNECT_ACCOUNT_COOKIE",
            details=f"Connected Instagram @{info['username']} via Instagrapi Cookie",
            entity_type="Account"
        )
        db.add(log)
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully connected @{info['username']} via Cookie!",
            "account": {
                "id": info["pk"],
                "username": info["username"],
                "full_name": info["full_name"],
                "avatar_url": info["profile_pic_url"]
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Instagram Cookie Login Error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Instagram Cookie Login Failed: {str(e)}")

@router.post("/instagram/credential-login")
async def instagram_credential_login(
    req: CredentialLoginRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_from_token)
):
    """
    Connects Instagram Account using username + password via instagrapi mobile login.
    Produces a full-trust MOBILE SESSION that works for all upload types including
    album/carousel (configure_sidecar) — unlike browser sessionid (web session).
    If Instagram requires email/SMS challenge, returns a structured challenge_required response.
    """
    try:
        info = await instagrapi_service.connect_with_credentials(req.username, req.password)
        return _save_instagram_account(db, info, req.workspace_id, req.client_id, method="Credentials", current_user=current_user)

    except Exception as e:
        err_str = str(e)
        # Detect challenge_required signal from service layer
        if err_str.startswith("challenge_required:"):
            uname = err_str.split(":")[1].split("\n")[0].strip()
            return {
                "status": "challenge_required",
                "username": uname,
                "message": "Instagram requires email/SMS verification. Enter the 6-digit code sent to your registered email."
            }
        db.rollback()
        logger.error(f"Instagram Credential Login Error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Instagram Credential Login Failed: {err_str}")


@router.post("/instagram/challenge-resolve")
async def instagram_challenge_resolve(
    req: ChallengeResolveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_from_token)
):
    """
    Completes a pending Instagram login challenge by submitting the 6-digit code.
    Must be called after /instagram/credential-login returns challenge_required.
    """
    try:
        info = await instagrapi_service.resolve_challenge(req.username, req.code)
        return _save_instagram_account(db, info, req.workspace_id, req.client_id, method="Credentials (Challenge)", current_user=current_user)
    except Exception as e:
        db.rollback()
        logger.error(f"Instagram Challenge Resolve Error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Challenge Resolution Failed: {str(e)}")


def _save_instagram_account(
    db: Session,
    info: dict,
    workspace_id: Optional[str],
    client_id: Optional[str],
    method: str = "Cookie",
    current_user: Optional[User] = None
) -> dict:
    """Helper: saves/updates Instagram account in DB after a successful login.
    Routes new account to the current user's workspace (not the global first workspace).
    """
    target_ws, target_client = _get_user_target_workspace(db, current_user, workspace_id, client_id)

    session_json = json.dumps(info["session_settings"])
    encrypted_token = meta_adapter.encrypt_token(session_json)

    ig_acc = db.query(SocialAccount).filter(
        SocialAccount.workspace_id == target_ws.id,
        SocialAccount.platform == AccountPlatform.INSTAGRAM_BUSINESS,
        SocialAccount.username == info["username"]
    ).first()

    if not ig_acc:
        ig_acc = SocialAccount(
            workspace_id=target_ws.id,
            client_id=target_client.id,
            platform=AccountPlatform.INSTAGRAM_BUSINESS,
            platform_account_id=info["pk"],
            name=info["full_name"] or info["username"],
            username=info["username"],
            avatar_url=info["profile_pic_url"] or "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
            access_token_encrypted=encrypted_token,
            status=AccountStatus.CONNECTED,
            followers_count=info["follower_count"] or 1000
        )
        db.add(ig_acc)
    else:
        ig_acc.access_token_encrypted = encrypted_token
        ig_acc.status = AccountStatus.CONNECTED
        ig_acc.platform_account_id = info["pk"]

    log = ActivityLog(
        workspace_id=target_ws.id,
        action=f"CONNECT_ACCOUNT_{method.upper().replace(' ', '_')}",
        details=f"Connected Instagram @{info['username']} via {method} (Full Mobile Session)",
        entity_type="Account"
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully connected @{info['username']} via {method}!",
        "account": {
            "id": info["pk"],
            "username": info["username"],
            "full_name": info["full_name"],
            "avatar_url": info["profile_pic_url"]
        }
    }

@router.post("/meta/callback")
async def meta_callback(
    code: str = Query(..., description="Authorization code from Meta/Instagram"),
    workspace_id: Optional[str] = Query(None, description="Target workspace ID"),
    client_id: Optional[str] = Query(None, description="Target client ID"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_from_token)
):
    """Processes Meta / Instagram OAuth callback code, exchanges token, and saves accounts."""
    try:
        target_ws, target_client = _get_user_target_workspace(db, current_user, workspace_id, client_id)

        # Execute Meta Token Exchange
        token_data = await meta_adapter.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        if not access_token:
            raise Exception("Meta OAuth failed: access_token not returned.")

        accounts_data = await meta_adapter.get_user_accounts(access_token)
        connected_accounts = []

        if not accounts_data:
            logger.info("No Facebook Pages returned from Graph API. Creating primary connected account placeholder.")
            placeholder_acc = SocialAccount(
                workspace_id=target_ws.id,
                client_id=target_client.id,
                platform=AccountPlatform.INSTAGRAM_BUSINESS,
                platform_account_id=token_data.get("user_id", "meta_user_101"),
                name="Connected Meta Account",
                username="meta_connected_account",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                access_token_encrypted=meta_adapter.encrypt_token(access_token),
                status=AccountStatus.CONNECTED,
                followers_count=1000
            )
            db.add(placeholder_acc)
            connected_accounts.append("Connected Meta Account")

        for page in accounts_data:
            page_id = page.get("page_id") or page.get("id")
            page_name = page.get("page_name") or page.get("name")
            page_token = page.get("access_token", access_token)
            
            # 1. Add Facebook Page
            fb_acc = db.query(SocialAccount).filter(
                SocialAccount.workspace_id == target_ws.id,
                SocialAccount.platform == AccountPlatform.FACEBOOK_PAGE,
                SocialAccount.platform_account_id == page_id
            ).first()

            if not fb_acc:
                fb_acc = SocialAccount(
                    workspace_id=target_ws.id,
                    client_id=target_client.id,
                    platform=AccountPlatform.FACEBOOK_PAGE,
                    platform_account_id=page_id,
                    name=page_name,
                    username=page_name.lower().replace(" ", "_"),
                    avatar_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
                    access_token_encrypted=meta_adapter.encrypt_token(page_token),
                    status=AccountStatus.CONNECTED,
                    followers_count=15200
                )
                db.add(fb_acc)
            else:
                fb_acc.access_token_encrypted = meta_adapter.encrypt_token(page_token)
                fb_acc.status = AccountStatus.CONNECTED

            connected_accounts.append(page_name)

            # 2. Add IG Business Account if linked
            ig_data = page.get("instagram_business_account")
            if ig_data:
                ig_id = ig_data.get("id")
                ig_username = ig_data.get("username", "instagram_biz")
                ig_acc = db.query(SocialAccount).filter(
                    SocialAccount.workspace_id == target_ws.id,
                    SocialAccount.platform == AccountPlatform.INSTAGRAM_BUSINESS,
                    SocialAccount.platform_account_id == ig_id
                ).first()

                if not ig_acc:
                    ig_acc = SocialAccount(
                        workspace_id=target_ws.id,
                        client_id=target_client.id,
                        platform=AccountPlatform.INSTAGRAM_BUSINESS,
                        platform_account_id=ig_id,
                        name=ig_data.get("name", ig_username),
                        username=ig_username,
                        avatar_url=ig_data.get("profile_picture_url"),
                        access_token_encrypted=meta_adapter.encrypt_token(page_token),
                        status=AccountStatus.CONNECTED,
                        followers_count=ig_data.get("followers_count", 24100)
                    )
                    db.add(ig_acc)
                else:
                    ig_acc.access_token_encrypted = meta_adapter.encrypt_token(page_token)
                    ig_acc.status = AccountStatus.CONNECTED
                
                connected_accounts.append(f"@{ig_username}")

        # Activity Log
        log = ActivityLog(
            workspace_id=target_ws.id,
            action="CONNECT_ACCOUNT",
            details=f"Connected {len(connected_accounts)} Meta/Instagram accounts ({', '.join(connected_accounts)})",
            entity_type="Account"
        )
        db.add(log)
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully connected {len(connected_accounts)} accounts.",
            "accounts": connected_accounts
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Meta Callback Error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
