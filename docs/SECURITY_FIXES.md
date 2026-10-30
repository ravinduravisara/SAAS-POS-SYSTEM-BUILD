# Universal SaaS POS + ERP — Security Hardening & Vulnerability Remediation

**Audit Version**: 2.0 (Commercial Hardening)  
**Status**: VERIFIED & SECURED  

---

## 1. Zero-Trust Multi-Tenant Isolation

### Vulnerability Addressed
Untrusted client-supplied tenant identifiers in headers or bodies (`req.body.tenantId` or `req.headers['x-tenant-id']`).

### Remediation
- Tenant identity is derived exclusively from the cryptographically verified JWT token decoded in `authMiddleware.js`.
- `tenantMiddleware.js` loads the tenant from the database, checks tenant lifecycle state (`ACTIVE`, `TRIAL`, `SUSPENDED`, etc.), and populates `req.tenantId`.
- All backend services bind database queries to `req.tenantId`. Attempts to read, update, or delete another tenant's records return 404 Not Found without leaking existence.

---

## 2. Password Cryptographic Upgrades

### Vulnerability Addressed
Vulnerability to rainbow table attacks and weak password hashes in legacy prototypes.

### Remediation
- Implemented Node.js crypto's `pbkdf2Sync` algorithm with:
  - 100,000 iterations
  - 64-byte key length
  - SHA-512 digest
  - 16-byte random salt generated via `crypto.randomBytes(16)`
- Password format: `pbkdf2$100000$<salt>$<hash>`.
- Plaintext passwords or weak MD5/SHA-1 hashes are completely prohibited.

---

## 3. Rate Limiting & DoS Protection

### Vulnerability Addressed
Brute-force credential attacks on `/api/auth/login` and volumetric API abuse.

### Remediation
- **Auth Endpoint Limiter**: 5 requests per 15 minutes per IP window (`authLimiter`). Rejections return HTTP 429 with `Too many login attempts. Please try again later.`
- **API Gateway Limiter**: 200 requests per 15 minutes per IP window (`apiLimiter`).
- **Helmet Security Headers**: Strict Content-Security-Policy, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN.

---

## 4. Production Database Isolation & Mock Disablement

### Vulnerability Addressed
Unsafe test mocks or in-memory tables becoming active in production environments.

### Remediation
- In `server/src/config/db.js`, any attempt to set `USE_MOCK_DB=true` while `NODE_ENV=production` triggers an immediate fatal startup error (`[SECURITY FATAL] USE_MOCK_DB cannot be enabled in production environment`).
- Startup fails immediately if production secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are omitted.
