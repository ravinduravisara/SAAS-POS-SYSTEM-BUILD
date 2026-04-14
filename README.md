# SAAS POS + ERP Platform

Multi-tenant monorepo with:
- React + Vite client (`client/`)
- Express + Supabase backend (`server/`)

This project is configured for **super-admin-controlled onboarding**:
- Public registration is disabled
- Only super admins can create tenant/company accounts
- Tenant users can only sign in via `/login`

## Prerequisites
- Node.js 18+ (20+ recommended)
- A Supabase project

## Environment
Create `server/.env`:

```env
PORT=5001
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=replace_with_strong_secret
```

## Database Setup
Run SQL from `server/src/db/schema.sql` in Supabase SQL editor.

Important:
- `tenants.feature_overrides` must exist (used for per-tenant feature toggles)
- Seed data includes demo super admin and demo tenant account

## Run (Development)
In two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

- Client: `http://localhost:5173`
- Server: `http://localhost:5001`

## Production Build
```bash
npm run build:client
npm run start:server
```

## Authentication & Access
- Single login page: `/login`
- Super admins are redirected to `/super-admin`
- Tenant users are redirected to `/dashboard`

Demo credentials from seed SQL:
- Super admin: `superadmin@posplatform.com` / `superadmin123`
- Tenant admin: `admin@example.com` / `admin`

Passwords are automatically upgraded to hashed format after successful login.

## Plans & Feature Model
Plan defaults are defined in `shared/constants/plans.js`.

Each tenant gets:
- plan-based defaults
- optional per-tenant overrides (`tenants.feature_overrides`)

Super admin can enable/disable modules per tenant from:
- `/super-admin/tenants/:id`

Backend feature-gated modules include:
- reports (`reports`)
- inventory (`inventoryManagement`)
- purchases (`purchaseManagement`)
- expenses (`expenseManagement`)

## Super Admin Workflow
1. Login as super admin.
2. Open `/super-admin/tenants`.
3. Create company tenant with initial tenant admin credentials.
4. Adjust plan/status.
5. Toggle tenant features from tenant detail page.

## ERP Expansion
ERP-ready feature flags are already present:
- `erpCore`
- `procurement`
- `accounting`
- `hrm`

Use these flags to progressively enable ERP modules in UI/routes/services as new features are added.
