---
name: devsecops
description: DevSecOps workflow untuk AgencyOS — shift-left security: ENV secret management, dependency audit, SAST, dan security hardening FastAPI. Menggunakan Graphify, bandit, dan pip-audit tanpa LLM eksternal. Gunakan saat ditanya tentang DevSecOps, CI security, secret management, dependency audit, atau "keamanan pipeline".
---

# Workflow: DevSecOps (AgencyOS)

> **Goal**: Catch security issues as early as possible — before commit, before deploy.

## Phase 1 — Secret & ENV Audit

### Check for hardcoded secrets
```bash
graphify query "os.getenv SECRET KEY TOKEN PASSWORD"
```

Then verify `backend/config.py` — all production secrets **must** come from env vars with NO hardcoded fallback in production:

```python
# BAD (current pattern in config.py — fallback leaks real credentials)
SECRET_KEY = os.getenv("SECRET_KEY", "real-secret-here")

# GOOD — fail fast in production if env missing
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY and os.getenv("ENV") == "production":
    raise RuntimeError("SECRET_KEY env var is required in production")
```

Fix all sensitive keys in `config.py`:
- `POSTGRES_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN`
- `B2_ACCESS_KEY` / `B2_SECRET_KEY`
- `META_CLIENT_SECRET`
- `MIDTRANS_SERVER_KEY`
- `FONNTE_TOKEN`
- `POSTFORME_API_KEY`

### Verify .gitignore coverage
```bash
# Confirm .env files are gitignored
git check-ignore -v backend/.env.local
git check-ignore -v .env
```

## Phase 2 — Dependency Vulnerability Scan

```bash
# Python dependencies
pip-audit -r backend/requirements.txt

# Node/Next.js dependencies  
npm audit --prefix frontend

# Fix automatically where possible
pip-audit -r backend/requirements.txt --fix
npm audit fix --prefix frontend
```

## Phase 3 — Static Analysis (SAST)

```bash
# Python: Bandit SAST
pip install bandit
bandit -r backend/ -f json -o bandit-report.json --skip B104

# Review high/medium findings
bandit -r backend/ -ll  # only medium and high severity
```

Key Bandit checks for AgencyOS:
- `B105` — Hardcoded password string
- `B106` — Hardcoded password in function argument
- `B107` — Hardcoded password in function default
- `B501`/`B502` — SSL/TLS misconfiguration
- `B608` — SQL injection risk

## Phase 4 — Runtime Security Checklist

Use Graphify to verify each item is properly implemented:

```bash
# 1. Auth on all sensitive routes
graphify query "require_user admin workspace"

# 2. Input sanitization used consistently  
graphify query "sanitize_payload sanitize_text"

# 3. Rate limiting covers auth endpoints
graphify query "SecurityMiddleware auth_limiter"

# 4. No debug info leaking in responses
graphify query "traceback exception detail response"

# 5. File upload path validation
graphify query "upload filename path B2"
```

## Phase 5 — Update Graph After Fixes

```bash
graphify update .
```

---

## DevSecOps Gates Summary

| Gate | Tool | When |
|------|------|------|
| Secret scan | Manual `config.py` review | Pre-commit |
| Dependency audit | `pip-audit`, `npm audit` | Pre-push / CI |
| SAST | `bandit` | CI on PR |
| AI Review | Antigravity (me) | On demand |
| Runtime security | Manual checklist above | Pre-deploy |
