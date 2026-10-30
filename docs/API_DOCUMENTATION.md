# Universal SaaS POS + ERP — REST API Documentation

## 1. Authentication & Headers

All tenant requests require an Authorization Bearer token obtained from `/api/auth/login`.

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Idempotency-Key: <UUID> (Optional on checkout)
```

### Error Response Format
All API errors return consistent JSON:
```json
{
  "error": {
    "status": 403,
    "message": "The module 'restaurant.core' is disabled for this workspace or not included in the 'starter' plan.",
    "code": "FEATURE_DISABLED",
    "feature": "restaurant.core"
  },
  "message": "This feature requires a higher plan or module activation. Current plan: starter"
}
```

---

## 2. Authentication API (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.
- **Request Body**:
  ```json
  { "email": "admin@example.com", "password": "Password123!" }
  ```
- **Response** (200 OK):
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { "id": "u_1", "name": "Admin", "email": "admin@example.com", "role": "admin" },
    "tenant": { "id": "tenant_1", "name": "Store HQ", "plan": "pro", "status": "active" }
  }
  ```

### `GET /api/auth/me`
Returns details of the currently authenticated user and active tenant.

---

## 3. Core POS & Sales API (`/api/sales`)

### `POST /api/sales`
Processes a POS sale with authoritative backend price recalculation and stock check.
- **Request Body**:
  ```json
  {
    "items": [
      { "productId": "p_1", "quantity": 2 }
    ],
    "paymentMethod": "split",
    "payments": [
      { "method": "cash", "amount": 500 },
      { "method": "card", "amount": 1000 }
    ],
    "discount": 0,
    "customerName": "Walk-in Customer"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "s_101",
    "invoiceNumber": "INV-1730000000000",
    "subtotal": 1500,
    "taxTotal": 0,
    "discountTotal": 0,
    "total": 1500,
    "status": "completed",
    "items": [ ... ]
  }
  ```

### `POST /api/sales/:id/refund`
Refunds a completed sale and restores product stock.
- **Request Body**:
  ```json
  { "reason": "Customer returned unopened item" }
  ```

---

## 4. Super Admin Management API (`/api/super-admin`)

Only accessible to verified platform super administrators.

### `GET /api/super-admin/overview`
Returns platform metrics including active tenants, MRR, ARR, and plan distributions.

### `GET /api/super-admin/features`
Returns full catalog of master features and industry presets.

### `POST /api/super-admin/tenants`
Onboards a new commercial business tenant.
- **Request Body**:
  ```json
  {
    "name": "Ocean Bay Seafood Restaurant",
    "email": "owner@oceanbay.com",
    "plan": "enterprise",
    "industryPreset": "restaurant",
    "maxUsers": 10,
    "maxBranches": 3,
    "maxProducts": 500
  }
  ```

### `PATCH /api/super-admin/tenants/:id/status`
Updates business operational lifecycle status (`active`, `suspended`, `cancelled`, `trial`).

### `PATCH /api/super-admin/tenants/:id/features`
Sets custom per-tenant feature overrides.

---

## 5. Multi-Branch API (`/api/branches`)

- `GET /api/branches`: Lists branches for the tenant.
- `POST /api/branches`: Creates a branch (enforces `max_branches` quota).
- `PUT /api/branches/:id`: Updates branch metadata.

---

## 6. Financial Reports API (`/api/reports`)

- `GET /api/reports/overview`: Summary of revenue, net profit, tax, expenses, and payment breakdown.
- `GET /api/reports/sales/export`: Streams sales ledger as standard downloadable CSV.

---

## 7. Industry Modules API

### Restaurant (`/api/restaurant`) - Gated by `restaurant.core`
- `GET /api/restaurant/tables`: Floor plan and table statuses.
- `PUT /api/restaurant/tables/:id/status`: Updates table status.
- `POST /api/restaurant/orders`: Creates waiter order and marks table occupied.
- `PUT /api/restaurant/orders/:id/status`: Updates order progress (`preparing`, `ready`, `paid`).
- `GET /api/restaurant/kitchen/orders`: Live Kitchen Display System (KDS) order stream.

### Service Center & Repairs (`/api/repairs`) - Gated by `repairs.jobCards`
- `GET /api/repairs/jobs`: List repair job cards with status filter.
- `POST /api/repairs/jobs`: Creates diagnostic work order.
- `PUT /api/repairs/jobs/:id/status`: Status transition (automatically decrements inventory for consumed spare parts when set to `completed`).

### Salon & Appointments (`/api/salon`) - Gated by `salon.appointments`
- `GET /api/salon/services`: List services catalog.
- `GET /api/salon/stylists`: List stylists.
- `GET /api/salon/appointments`: Filter appointments by date or stylist.
- `POST /api/salon/appointments`: Book appointment (prevents double-booking with HTTP 409).
- `PUT /api/salon/appointments/:id/status`: Update status (`in_progress`, `completed`, `cancelled`).

### HRM & Payroll (`/api/hrm`) - Gated by `hrm.core` & `hrm.payroll`
- `GET /api/hrm/employees`: Staff directory.
- `POST /api/hrm/employees`: Add staff member.
- `GET /api/hrm/attendance`: Daily attendance ledger.
- `POST /api/hrm/attendance`: Record clock-in.
- `POST /api/hrm/payroll/generate`: Compute monthly salary slips with bonuses and deductions.
- `PUT /api/hrm/payroll/:id/pay`: Mark pay slip as disbursed.

