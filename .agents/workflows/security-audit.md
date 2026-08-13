---
name: security-audit
description: Run a comprehensive security audit on the AgencyOS backend — covering rate limit bypass, authentication flaws, IDOR, ENV leakage, CORS misconfiguration, and input validation. Uses Graphify graph queries first to stay token-efficient before reading raw source files. Use when the user asks for a security review, pentest, DevSecOps check, vulnerability scan, or "audit keamanan". No external tools required — uses bandit, pip-audit, and direct API testing.
---

# Workflow: Security Audit (AgencyOS)

> **Token-first rule**: Always query Graphify before reading raw files. Only open source files when the graph query is insufficient.

## Step 1 — Ensure Graph is Fresh

```bash
# Check graph exists
Test-Path graphify-out/graph.json

# Update if code changed recently
graphify update .
```

## Step 2 — Scope the Audit via Graphify Queries

Run targeted queries to map the attack surface without reading every file:

```bash
# Map all auth & security entry points
graphify query "authentication middleware rate limit security"

# Find all routes that accept user input
graphify query "POST PUT PATCH request body validation"

# Find env variable usage patterns
graphify query "os.getenv settings SECRET KEY TOKEN"

# Find CORS and origin handling
graphify query "CORS origin allowed headers"

# Map DB query patterns for SQL injection risk
graphify query "database query raw SQL execute text"

# Map file upload handling
graphify query "file upload media B2 storage"
```

## Step 3 — Targeted File Review (Only What Graph Flags)

Only read files that appeared in suspicious graph nodes:

- `backend/security.py` — Rate limiter, middleware, CORS
- `backend/config.py` — Hardcoded secrets / ENV fallback values
- `backend/routers/firebase_auth.py` — Token validation, `require_user()`
- `backend/routers/auth.py` — Login, session, credential handling
- Any router flagged with raw SQL or unvalidated input

## Step 4 — Static Analysis (SAST) via Bandit

```bash
# Install bandit (Python SAST scanner)
pip install bandit

# Scan backend — show only medium & high severity
bandit -r backend/ -ll

# Full JSON report
bandit -r backend/ -f json -o bandit-report.json
```

Key checks for AgencyOS:
- `B105/B106/B107` — Hardcoded passwords/secrets
- `B608` — SQL injection via string formatting
- `B501/B502` — SSL/TLS misconfiguration
- `B104` — Binding to all interfaces

## Step 5 — Report Findings

For each finding, document:
- **Severity**: Critical / High / Medium / Low / Info
- **Location**: File + line number (use `graphify explain "<symbol>"` to locate)
- **Description**: What the vulnerability is
- **PoC**: Minimal reproduction steps or curl command
- **Fix**: Exact code change recommended

## Step 6 — Apply Fixes & Update Graph

After making security fixes:
```bash
graphify update .
```

---

## Quick Reference: Common AgencyOS Attack Vectors

| Area | Risk | Graphify Query |
|------|------|---------------|
| Rate Limiter | X-Forwarded-For bypass | `graphify query "InMemoryRateLimiter _get_client_key"` |
| Config | Hardcoded secrets | `graphify query "os.getenv SECRET_KEY"` |
| Auth | Token not verified | `graphify query "require_user firebase_auth"` |
| Admin routes | Missing auth check | `graphify query "admin.py router"` |
| File uploads | Path traversal | `graphify query "media upload B2"` |
| DB queries | Raw SQL | `graphify query "text execute conn"` |
| CORS | Wildcard origin | `graphify query "allowed_origins CORS"` |
