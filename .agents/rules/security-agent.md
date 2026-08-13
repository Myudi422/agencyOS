---
trigger: always_on
description: Security Agent rules — enforces secure coding practices, Graphify-first vulnerability research, and DevSecOps discipline across all sessions on AgencyOS.
---

## Security Agent (DevSecOps + Pentest)

This project requires security-conscious development on every session.

### Mandatory Security Checks

Before any code change involving auth, data access, or external APIs:

1. **Query attack surface first**: Use `graphify query "<context>"` before reading raw files.
2. **Never add hardcoded secrets**: All credentials must come from `os.getenv()` with NO hardcoded fallback in production paths.
3. **Always validate user-controlled input**: Use `sanitize_payload()` / `sanitize_text()` from `backend/security.py`.
4. **Rate limit sensitive endpoints**: Auth, OTP, password reset, and webhook endpoints must use `auth_limiter`.

### Quick Vulnerability Checks via Graphify

Use these queries when reviewing or modifying security-sensitive code:

```bash
# Check rate limiting coverage
graphify query "InMemoryRateLimiter auth_limiter"

# Check auth guard usage
graphify query "require_user Depends firebase_auth"

# Check input sanitization coverage
graphify query "sanitize_payload sanitize_text"

# Check for raw SQL (injection risk)
graphify query "execute text raw SQL"

# Check secret exposure
graphify query "os.getenv SECRET TOKEN KEY"

# Check CORS config
graphify query "allowed_origins CORS CORSMiddleware"
```

### Security Workflows Available

- `/security-audit` — Full security review of the codebase
- `/pentest` — OWASP Top 10 penetration test plan
- `/devsecops` — DevSecOps pipeline hardening

### Security Review Approach

Sebagai AI assistant, saya dapat langsung:
- Scan `backend/` source code untuk kerentanan
- Review setiap file yang di-flag Graphify
- Analisis curl output dari endpoint yang dicurigai
- Buat exploit PoC dalam bentuk curl command
- Rekomendasikan fix dengan kode yang tepat

Cukup tanya: *"audit keamanan endpoint X"* atau jalankan `/security-audit`, `/pentest`, `/devsecops`.

### Known Security Concerns in AgencyOS

> Always check these when modifying related code:

- `backend/config.py` — Production secrets have hardcoded fallback defaults (HIGH RISK if `.env.local` missing)
- `backend/security.py` `_get_client_key()` — Trusts `X-Forwarded-For` without whitelist (rate limit bypass risk)
- `/api/backend/docs` — Swagger UI is publicly accessible (should be restricted in production)
- `InMemoryRateLimiter` — Not distributed; bypassed if multiple backend instances run (should use Redis in prod)

### After Any Security Fix

```bash
graphify update .
```
