
# API Docs

Base URL: `http://localhost:5001/api`

## Auth
- `POST /auth/login`
- `GET /auth/me`

## Super Admin
- `GET /super-admin/stats`
- `GET /super-admin/tenants`
- `POST /super-admin/tenants` (creates tenant + initial admin user)
- `PUT /super-admin/tenants/:id/status`
- `PUT /super-admin/tenants/:id/plan`
- `PUT /super-admin/tenants/:id/features`
- `GET /super-admin/subscriptions`

## Products
- `GET /products`

## Categories
- `GET /categories`

## Sales
- `POST /sales`

## Reports
- `GET /reports/summary`

## Feature-Gated Tenant Modules
- Inventory routes require `inventoryManagement`
- Purchases routes require `purchaseManagement`
- Expenses routes require `expenseManagement`
- Reports route requires `reports`
