# Deployment Guide

## 1. Provision Dependencies
- Create a Supabase project
- Run `server/src/db/schema.sql` in Supabase SQL editor
- Verify tables are created (`tenants`, `users`, `subscriptions`, `tenant_settings`, etc.)

## 2. Configure Server Environment
Set these environment variables for your server host:

```env
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://your-client-domain
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=strong_random_secret
```

## 3. Build Client
```bash
npm --prefix client ci
npm --prefix client run build
```

Output is generated in `client/dist`.

## 4. Start API Server
```bash
npm --prefix server ci
npm --prefix server run start
```

Health check:
- `GET /health` should return `{ "ok": true }`

## 5. Reverse Proxy / Routing
Use Nginx (or equivalent) with:
- static hosting for `client/dist`
- API forwarding to server for `/api/*`

## 6. First Login and Onboarding
1. Login with super admin credentials from seeded data.
2. Create tenant/company from `/super-admin/tenants`.
3. Share tenant admin credentials with company owner.

## 7. Security Notes
- Change demo credentials immediately.
- Set a strong `JWT_SECRET`.
- Restrict `SUPABASE_SERVICE_ROLE_KEY` to backend only (never expose in client).
- Configure CORS to only trusted frontend domains.

## 8. Post-Deployment Smoke Tests
- Super admin login works
- Tenant creation works
- Tenant user login works
- Feature toggles for reports/inventory/purchases/expenses enforce access on API
