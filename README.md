# POS System

Monorepo with a Vite + React client and an Express server.

## Prereqs
- Node.js 18+ (recommended: 20+)

## Run (dev)
In two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

- Client: http://localhost:5173
- Server: http://localhost:5001

## Build
```bash
npm run build:client
```

## Login

The app uses a single `/login` page for both tenant users and super admins.

- Tenant users are redirected to `/dashboard`
- Super admins are redirected to `/super-admin`

Demo credentials:

- Tenant admin: `admin@example.com` / `admin`
- Super admin: `superadmin@posplatform.com` / `superadmin123`

## Plans

| Plan | Price | Users | Products | Reports | Multi-location |
| --- | --- | --- | --- | --- | --- |
| Starter | $9.99 | 2 | 100 | No | No |
| Pro | $29.99 | 10 | 1000 | Yes | No |
| Enterprise | $99.99 | Unlimited | Unlimited | Yes | Yes |

## Tenant Onboarding

Create a new tenant in either of these ways:

1. Open `/register` and sign up with your name, email, password, store name, and plan.
2. Sign in as a super admin and create a tenant from `/super-admin/tenants`.

Registration creates the tenant, first admin user, trial subscription, and isolated in-memory collections.

## Supabase Later

The app is still using in-memory storage only. When you are ready to connect Supabase later, start by replacing the data access layer in:

- `server/src/data/store.js`
- `server/src/config/db.js`

Keep the API contract intact so the client can continue using the same auth, tenant, and subscription flow.

## Notes

- The backend currently uses in-memory demo data for a demo tenant plus a super-admin account.
- Tenant-facing routes are scoped by tenant middleware, and reports are additionally gated by the active plan.
