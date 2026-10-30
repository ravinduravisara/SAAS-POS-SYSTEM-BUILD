# Universal SaaS POS + ERP — Security Architecture & Threat Model

## 1. Authentication Security

### Salted Password Hashing
- Passwords are encrypted using Node.js crypto's `pbkdf2` algorithm with 100,000 iterations, 64-byte key length, and SHA-512 digest.
- Every password hash is prepended with a cryptographically secure random 16-byte salt: `pbkdf2$100000$<salt>$<hash>`.
- Plaintext passwords or unsalted hashes are never stored.

### JWT Cryptographic Signing
- JWT tokens are signed using HMAC-SHA256 with a production-grade 64+ character secret key.
- Tokens expire after 24 hours to mitigate session hijacking risks.
- Forged or expired tokens immediately trigger HTTP 401 Unauthorized.

---

## 2. API Gateway & Network Security

### Helmet Security Headers
The server incorporates `helmet` to set defensive HTTP headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)

### Rate Limiting
- **General API Limiter**: Limits requests to 200 requests per 15-minute window per IP to prevent Denial-of-Service (DoS) abuse.
- **Auth Endpoint Limiter**: Aggressive rate limiting on `/api/auth/login` (5 attempts per 15 minutes) to defeat brute-force and credential-stuffing attacks.

### CORS Origin Validation
Cross-Origin Resource Sharing is restricted strictly to the configured `CLIENT_URL`. Wildcard (`*`) CORS is prohibited in production.

---

## 3. Data Integrity & Financial Protection

### Idempotency Protection
POS checkout requests accept an `Idempotency-Key` HTTP header. Duplicate requests resulting from network timeouts or double clicks return the original transaction without double-charging or deducting duplicate inventory.

### Strict Decimal-Safe Calculations
Floating-point arithmetic is banned for financial processing. The platform calculates minor units (cents) using `shared/utils/decimal.js` to eliminate rounding discrepancies and penny arbitrage vulnerabilities.

