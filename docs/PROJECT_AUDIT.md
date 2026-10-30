# Universal SaaS POS + ERP Platform — Project Implementation Audit

**Audit Date**: October 2026  
**Platform Version**: 0.1.0-alpha  
**Auditor**: Senior SaaS Architect & Security Engineer  
**Objective**: Comprehensive audit of existing codebase, identification of working vs missing features, architectural vulnerabilities, database schema gaps, API design issues, and concrete remediation paths.

---

## 1. Executive Summary

The existing repository is an early-stage multi-tenant POS prototype with an initial Express/Supabase backend and a React/Vite/Redux frontend. While the foundational skeleton for tenant onboarding and basic product/category/customer management exists, critical enterprise requirements—including transaction integrity, concurrency-safe inventory deduction, financial audit trails, role-based authorization, multi-branch operations, comprehensive feature registries, industry ERP modules, and automated tests—are currently missing or incomplete.

Several critical security and architectural risks require immediate remediation:
1. **Frontend Financial Calculation Trust**: `saleService.js` blindly trusts subtotal, total, and item prices supplied by the client.
2. **Race Conditions in Inventory**: Stock updates use a non-atomic `select` followed by an `update`, resulting in lost updates and overselling under concurrent load.
3. **Lack of Database Transactions**: Multi-step sales (sale record + sale items + stock updates + inventory logs) run sequentially without a database transaction, causing partial persistence upon failure.
4. **Weak/Demo Credentials & Ambiguous Authentication**: Seed script contains hard-coded plaintext passwords (`superadmin123`, `admin`), `users` table allows duplicate emails across tenants but `/auth/login` uses `limit(1)` without tenant resolution, and new users default to `'password'`.
5. **Placeholder Stubs in Core Modules**: `Sales.jsx`, `Purchases.jsx`, and `Expenses.jsx` contain only placeholder cards (`<div>Sales page</div>`), while all files in `server/src/models/` and `server/src/jobs/` are 0-byte stubs.
6. **No Automated Testing Suite**: Backend `test` script returns `"No tests"`, leaving business logic, isolation, and security unverified.

---

## 2. Module-by-Module Audit

### 2.1 Platform Super Admin & Tenant Management
- **Status**: PARTIAL
- **Important Files**:
  - `server/src/routes/superAdminRoutes.js`
  - `server/src/controllers/superAdminController.js`
  - `client/src/pages/superAdmin/SuperAdminDashboard.jsx`
  - `client/src/pages/superAdmin/TenantList.jsx`
  - `client/src/pages/superAdmin/TenantDetail.jsx`
  - `client/src/pages/superAdmin/Subscriptions.jsx`
- **Current Behavior**: Super admin can list tenants, view simple usage counters, toggle hardcoded boolean plan features, and update subscription status.
- **Missing Functionality**:
  - Full business onboarding fields (business registration number, phone, address, currency, timezone, tax identifiers, storage quota, usage limits).
  - Business status lifecycle state machine (`TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`, `ARCHIVED`) with enforced access rules.
  - Platform revenue calculations based on double-entry billing logs rather than a naive sum of active subscription table amounts.
  - Granular usage limit enforcement (max users, max products, max branches, max monthly transactions).
  - Tenant data export and verified tenant-isolated restore workflows.
  - Super admin platform audit logging.
- **Security Concerns**:
  - Deleting a tenant (`deleteTenant`) cascades across tables without archival retention or soft deletion.
  - No MFA for platform administrators.
- **Required Database Changes**:
  - Expand `tenants` table with detailed metadata, status history, and usage quotas.
  - Add `platform_audit_logs`, `subscription_invoices`, and `tenant_usage` tables.
- **Required API Changes**:
  - Support comprehensive tenant onboarding and tenant status transition endpoints.
  - Introduce `/api/v1/platform/analytics`, `/api/v1/platform/audit-logs`, `/api/v1/platform/plans`.
- **Required UI Changes**:
  - Professional Super Admin dashboard with MRR/ARR charts, churn analysis, tenant filterable tables, and preset selector.
- **Testing Requirements**:
  - Super admin authentication, tenant creation, quota enforcement, status transitions.
- **Implementation Priority**: HIGH (Phase 1 & Phase 3)

---

### 2.2 Feature Activation & Entitlements System
- **Status**: PARTIAL
- **Important Files**:
  - `shared/constants/plans.js`
  - `server/src/utils/planFeatures.js`
  - `server/src/middlewares/planMiddleware.js`
  - `client/src/hooks/usePlan.js`
  - `client/src/components/common/PlanGate.jsx`
- **Current Behavior**: Hardcoded plan object in `shared/constants/plans.js` checked against `req.tenant.featureOverrides`.
- **Missing Functionality**:
  - Centralized database-driven feature registry (`feature_definitions`, `feature_dependencies`).
  - Hierarchical feature resolution: Platform Entitlement -> Subscription Plan -> Tenant Overrides -> Dependency Validation -> User Permission.
  - Industry presets (Retail, Supermarket, Restaurant, Pharmacy, Service Center, Salon, Wholesale, Rental).
  - Feature dependency enforcement (e.g. `restaurant.kitchenDisplay` requires `restaurant.core`).
  - Dynamic frontend sidebar adapting to active entitlements and user permissions.
- **Security Concerns**:
  - Feature checks currently exist only on a few routes (`inventoryRoutes`, `purchaseRoutes`, `expenseRoutes`, `reportRoutes`), leaving other routes unprotected if new endpoints are added.
- **Required Database Changes**:
  - Create `feature_definitions`, `feature_dependencies`, `subscription_plans`, and `plan_entitlements` tables.
- **Required API Changes**:
  - Add feature entitlement middleware supporting composite dot-notation keys (`pos.returns`, `inventory.batchTracking`).
  - Super admin endpoints to query and update granular feature matrices.
- **Required UI Changes**:
  - Categorized feature toggle matrix with dependency warnings and industry preset loader.
- **Testing Requirements**:
  - Verify route rejection when feature is disabled; verify automatic dependency resolution.
- **Implementation Priority**: CRITICAL (Phase 3)

---

### 2.3 Authentication, Identity & Multi-Tenancy
- **Status**: BROKEN / HIGH SECURITY RISK
- **Important Files**:
  - `server/src/middlewares/authMiddleware.js`
  - `server/src/middlewares/tenantMiddleware.js`
  - `server/src/services/authService.js`
  - `server/src/controllers/authController.js`
  - `client/src/context/AuthContext.jsx`
  - `client/src/store/slices/authSlice.js`
- **Current Behavior**: JWT signed with secret, stored in client `localStorage`. Users authenticated by email lookup.
- **Missing Functionality & Flaws**:
  - Email collisions: `users` table has `unique(tenant_id, email)`, but `authService.login` queries `eq('email', email).limit(1)`. If the same email exists in multiple tenants, arbitrary tenant selection occurs.
  - No tenant picker / multi-membership resolution for users belonging to multiple businesses.
  - No rate limiting on `/login` or sensitive endpoints (vulnerable to brute-force attacks).
  - Demo passwords in seed file (`superadmin123`, `admin`) are plain text.
  - No refresh-token or session revocation mechanism; logout only clears local client state.
  - No audit log of login events or failed authentication attempts.
- **Required Database Changes**:
  - Add `tenant_memberships` or multi-tenant user resolution, session tracking / token revocation table, and `audit_logs`.
- **Required API Changes**:
  - Disambiguated login flow supporting multi-tenant user accounts and tenant switching.
  - Rate-limited auth routes (`express-rate-limit` or equivalent).
  - Token refresh and explicit session revocation endpoints.
- **Required UI Changes**:
  - Tenant selector screen when a user email has access to multiple businesses.
  - Security settings (password change, active sessions).
- **Testing Requirements**:
  - Unit & integration tests for password hashing, rate limiting, token expiration, multi-tenant email resolution.
- **Implementation Priority**: CRITICAL (Phase 1)

---

### 2.4 Point of Sale (POS) Terminal
- **Status**: PARTIAL / UNRELIABLE
- **Important Files**:
  - `client/src/pages/dashboard/POSScreen.jsx`
  - `client/src/components/pos/CheckoutPanel.jsx`
  - `client/src/components/pos/PaymentModal.jsx`
  - `client/src/components/pos/ReceiptPreview.jsx`
  - `server/src/controllers/saleController.js`
  - `server/src/services/saleService.js`
  - `server/src/validators/saleValidator.js`
- **Current Behavior**: Renders product grid, adds items to cart in Redux, computes totals on frontend, submits payload to `POST /api/sales`.
- **Missing Functionality & Flaws**:
  - **Severe**: Frontend sends calculated totals; backend saves them without authoritative re-calculation.
  - No support for barcodes/SKU fast scanner input, product variants, discounts, split payments, customer selection at checkout, holding/resuming sales.
  - No cash register shifts (opening cash, cash in/out, register reconciliation, shift reports).
  - Receipts are primitive plain-text strings without customizable business branding, tax registration info, or A4/58mm/80mm formats.
  - No returns, refunds, voids, or credit sales workflow.
- **Required Database Changes**:
  - Add `registers`, `cash_shifts`, `sale_discounts`, `sale_taxes`, `payments` (split payments), `refunds`, and `returns` tables.
- **Required API Changes**:
  - Authoritative backend pricing/tax recalculation engine.
  - Idempotency key validation to prevent duplicate submissions.
  - Register management and shift opening/closing endpoints.
  - Sale refunds, voids, and returns endpoints.
- **Required UI Changes**:
  - Fast keyboard-driven POS interface, barcode scanner listener, customer search modal, split payment modal, hold/resume drawer, register shift modal.
- **Testing Requirements**:
  - Concurrency sale testing, price tampering rejection, split payment verification, inventory deduction validation.
- **Implementation Priority**: CRITICAL (Phase 1 & Phase 2)

---

### 2.5 Inventory & Warehouse Management
- **Status**: PARTIAL
- **Important Files**:
  - `server/src/controllers/inventoryController.js`
  - `server/src/services/inventoryService.js`
  - `server/src/controllers/productController.js`
  - `server/src/services/productService.js`
  - `client/src/pages/dashboard/Inventory.jsx`
  - `client/src/pages/dashboard/Products.jsx`
  - `client/src/components/inventory/ProductForm.jsx`
  - `client/src/components/inventory/StockUpdateModal.jsx`
- **Current Behavior**: Products have basic name, price, stock, sku, category_id. Stock adjustments update product stock and insert into `inventory_logs`.
- **Missing Functionality**:
  - Non-concurrency safe updates: Race conditions during concurrent adjustments and sales.
  - No variant support (size, color, attributes) or serialized items.
  - No batch tracking, manufacturing dates, or expiry tracking (critical for grocery, pharmacy, food).
  - Single warehouse only (no multi-warehouse or branch-specific inventory).
  - No stock transfer, stock count reconciliation, damage, or reservation system.
  - No product cost price, wholesale price, barcode alias, reorder thresholds, or low-stock alerts.
- **Required Database Changes**:
  - Add `warehouses`, `business_locations`, `inventory_batches`, `product_variants`, `stock_transfers`, `stock_counts`.
- **Required API Changes**:
  - Atomic stock movement engine with reservation and ledger-based tracking.
  - Batch and variant management endpoints.
- **Required UI Changes**:
  - Advanced inventory table with batch/variant filters, stock transfer modal, stock adjustment ledger view, barcode generator.
- **Testing Requirements**:
  - Batch FIFO/FEFO allocation, stock adjustment concurrency tests, warehouse transfer consistency.
- **Implementation Priority**: HIGH (Phase 1, Phase 2, Phase 4)

---

### 2.6 Purchasing & Procurement Management
- **Status**: BROKEN / PLACEHOLDER
- **Important Files**:
  - `server/src/controllers/purchaseController.js`
  - `server/src/services/purchaseService.js`
  - `client/src/pages/dashboard/Purchases.jsx` (literally `<div>Purchases page</div>`)
- **Current Behavior**: Backend accepts arbitrary JSON array in `items`, increments stock in an unvalidated loop. Frontend page is a placeholder.
- **Missing Functionality**:
  - No real `suppliers` table (supplier is a free-text column).
  - No purchase order lifecycle: Purchase Request -> Approval -> Purchase Order -> Goods Receipt (GRN) -> Purchase Invoice -> Payment.
  - Stock increments immediately on purchase record creation instead of actual goods receipt.
  - No purchase returns or supplier outstanding balance tracking.
- **Required Database Changes**:
  - Create `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `purchase_invoices`, `supplier_payments`.
- **Required API Changes**:
  - Complete procurement workflow API with status transitions.
- **Required UI Changes**:
  - Complete Purchasing UI with PO creation, supplier selector, receiving modal, payment ledger.
- **Testing Requirements**:
  - Full purchasing lifecycle, GRN inventory updates, supplier balance calculation.
- **Implementation Priority**: HIGH (Phase 2 & Phase 4)

---

### 2.7 Sales Management, Invoicing & Returns
- **Status**: BROKEN / PLACEHOLDER
- **Important Files**:
  - `client/src/pages/dashboard/Sales.jsx` (`<div>Sales page</div>`)
  - `server/src/controllers/saleController.js`
  - `server/src/services/saleService.js`
- **Current Behavior**: Basic listing and sale creation. Sales history page on frontend is an empty placeholder card.
- **Missing Functionality**:
  - Searchable, filterable sales list with date, cashier, customer, payment method, and status filters.
  - Detailed sale inspection modal with item breakdown, payments, and reprint receipt options.
  - Refund and return processing with inventory restock rules.
  - Invoice PDF / thermal receipt download.
  - Quotations and proforma invoices.
- **Required Database Changes**:
  - Add `refunds`, `returns`, `quotations`, `invoices`, `credit_notes`.
- **Required API Changes**:
  - `/api/sales/:id`, `/api/sales/:id/refund`, `/api/sales/:id/receipt`, `/api/quotations`.
- **Required UI Changes**:
  - Sales data table with status badges, item expander, refund dialog, and receipt viewer.
- **Testing Requirements**:
  - Refund calculations, partial returns, tax reversals.
- **Implementation Priority**: HIGH (Phase 2)

---

### 2.8 Customer Management & CRM
- **Status**: PARTIAL
- **Important Files**:
  - `server/src/controllers/customerController.js`
  - `server/src/services/customerService.js`
  - `client/src/pages/dashboard/Customers.jsx`
  - `client/src/components/customers/CustomerForm.jsx`
  - `client/src/components/customers/CustomerTable.jsx`
- **Current Behavior**: Simple customer CRUD with name, phone, email.
- **Missing Functionality**:
  - Customer purchase history, credit limits, outstanding balances, payment ledgers.
  - Customer groups / segmentation (Retail vs Wholesale).
  - Loyalty point tracking and redemption.
- **Required Database Changes**:
  - Add `credit_limit`, `outstanding_balance`, `loyalty_points` to `customers`; add `customer_credit_transactions` and `customer_loyalty_transactions`.
- **Required API Changes**:
  - Endpoints for customer balance adjustment, credit settlement, loyalty redemption, and transaction history.
- **Required UI Changes**:
  - Enhanced Customer profile with purchase tab, credit statement tab, and loyalty history.
- **Testing Requirements**:
  - Customer credit limit checks during POS checkout, loyalty balance updates.
- **Implementation Priority**: MEDIUM (Phase 2)

---

### 2.9 Financial Management & Expenses
- **Status**: PARTIAL / INCOMPLETE
- **Important Files**:
  - `server/src/controllers/expenseController.js`
  - `server/src/services/expenseService.js`
  - `client/src/pages/dashboard/Expenses.jsx` (`<div>Expenses page</div>`)
- **Current Behavior**: Simple expenses table (title, amount, notes). Frontend is a placeholder.
- **Missing Functionality**:
  - Expense categories, payment accounts, recurring expenses, receipt attachments.
  - Cash flow tracking, receivables, payables, double-entry general ledger (optional ERP accounting module).
- **Required Database Changes**:
  - Add `expense_categories`, `payment_accounts`, `chart_of_accounts`, `journal_entries`, `journal_lines`.
- **Required API Changes**:
  - Full expense management with category filtering and accounting integration.
- **Required UI Changes**:
  - Professional Expense tracker with category breakdown, receipt modal, and expense reporting.
- **Testing Requirements**:
  - Expense authorization, category aggregation, journal balancing.
- **Implementation Priority**: MEDIUM (Phase 2 & Phase 4)

---

### 2.10 Reporting & Analytics
- **Status**: PARTIAL / SCALABILITY RISK
- **Important Files**:
  - `server/src/controllers/reportController.js`
  - `server/src/services/reportService.js`
  - `client/src/pages/dashboard/Reports.jsx`
- **Current Behavior**: Naive in-memory aggregation of all tenant sales for total revenue and top products.
- **Missing Functionality & Scalability Issues**:
  - Pulls unbounded sales records into server memory; will crash on production dataset.
  - Missing date filtering, branch filtering, category filtering, cashier performance, inventory valuation, profit & loss, and CSV/PDF export.
- **Required Database Changes**:
  - Efficient SQL aggregation functions and composite indexes on `(tenant_id, created_at)`.
- **Required API Changes**:
  - Server-side aggregated report endpoints with date range, category, and branch parameters.
  - CSV/PDF export streams.
- **Required UI Changes**:
  - Multi-tab report dashboard (Sales, Inventory, Profit & Loss, Tax, Cashier performance) with interactive charts.
- **Testing Requirements**:
  - Database aggregation accuracy, date range boundary validation.
- **Implementation Priority**: HIGH (Phase 2 & Phase 4)

---

### 2.11 Multi-Branch & Multi-Location
- **Status**: MISSING
- **Important Files**: None currently implemented.
- **Missing Functionality**:
  - Branches, locations, branch-specific registers, location inventory, inter-branch transfers, branch user assignments.
- **Required Database Changes**:
  - `business_locations`, `warehouses`, `user_location_assignments`, location-scoped columns in transactions.
- **Implementation Priority**: HIGH (Phase 4)

---

### 2.12 Industry ERP Modules (Restaurant, Repairs, Salon, Pharmacy, Wholesale, Rental, HRM)
- **Status**: MISSING
- **Important Files**: Placeholder flags in `plans.js` (`erpCore`, `procurement`, `accounting`, `hrm`).
- **Missing Functionality**:
  - **Restaurant**: Floor plans, tables, kitchen display system (KDS), kitchen order tickets (KOT), modifiers.
  - **Service Center / Repairs**: Job cards, device IMEI/serial tracking, diagnostic notes, technician assignment, spare parts consumption, warranty.
  - **Salon**: Stylist schedules, appointment booking calendar, service duration, commission.
  - **Pharmacy**: Medicine catalog, batch/expiry alerts, prescription validation flags.
  - **Wholesale**: Tiered price lists, minimum order quantities, credit terms.
  - **Rental**: Asset schedule, deposit tracking, late fee calculations.
  - **HRM**: Employee records, attendance, shifts, leave requests, payroll calculations.
- **Implementation Priority**: HIGH (Phase 5)

---

### 2.13 Audit Logging, Security & Hardening
- **Status**: BROKEN / MISSING
- **Important Files**:
  - `server/src/utils/logger.js` (simple console.log wrapper)
  - `server/src/models/` (0-byte stubs)
- **Missing Functionality**:
  - Immutable audit logs for financial events, configuration changes, permission updates, and login attempts.
  - Helmet security headers, API rate limiting, centralized error handling with sanitization.
  - Database row-level security (RLS) policies and tenant isolation testing.
- **Implementation Priority**: CRITICAL (Phase 1 & Phase 7)

---

## 3. Implementation Status Matrix

| Module | Status | Priority | Files / Impact Area |
| :--- | :--- | :--- | :--- |
| **Auth & Multi-Tenant Identity** | BROKEN | CRITICAL | `authService.js`, `tenantMiddleware.js`, token lifecycle, disambiguation |
| **Transaction Integrity & POS Backend** | BROKEN | CRITICAL | `saleService.js`, authoritative calculations, atomic stock update, idempotency |
| **POS Terminal Frontend** | PARTIAL | CRITICAL | `POSScreen.jsx`, `CheckoutPanel.jsx`, barcode, customer, split payment |
| **Super Admin Platform Control** | PARTIAL | HIGH | `superAdminController.js`, onboarding fields, status state machine, MRR metrics |
| **Feature Entitlement Engine** | PARTIAL | CRITICAL | Database feature registry, dependency graph, dynamic route/sidebar gates |
| **Inventory & Warehouses** | PARTIAL | HIGH | Batch tracking, variant attributes, stock ledger, multi-warehouse |
| **Sales & Invoicing UI** | BROKEN | HIGH | `Sales.jsx` (currently 0% UI), order detail, refunds, receipt print |
| **Purchasing & Procurement** | BROKEN | HIGH | `Purchases.jsx` (currently 0% UI), `purchaseService.js`, suppliers, GRN |
| **Customer Management & CRM** | PARTIAL | MEDIUM | Customer credit ledger, loyalty points, retail/wholesale tiers |
| **Expenses & Accounting** | PARTIAL | MEDIUM | `Expenses.jsx` (currently 0% UI), category breakdown, general ledger |
| **Reporting Engine** | PARTIAL | HIGH | Server-side SQL aggregation, date filters, P&L, CSV export |
| **Multi-Branch Operations** | MISSING | HIGH | Branches, locations, inter-branch transfers, branch scoping |
| **Restaurant & Café Module** | MISSING | HIGH | Tables, floor plan, KDS, KOT, menu modifiers |
| **Service Center / Repairs** | MISSING | HIGH | Job cards, device tracking, parts consumption, technician assignments |
| **Salon / Appointments** | MISSING | HIGH | Booking calendar, staff schedule, appointment POS |
| **Pharmacy Specifics** | MISSING | HIGH | Batch recall, expiry alerts, prescription flags |
| **Wholesale / Distribution** | MISSING | HIGH | Tier pricing, sales reps, bulk orders |
| **HRM & Payroll** | MISSING | HIGH | Employees, shifts, attendance, payroll records |
| **Security, Audit & Rate Limiting**| MISSING | CRITICAL | Audit trail, rate limiting, helmet, database isolation |
| **Automated Testing Suite** | MISSING | CRITICAL | Unit tests, isolation tests, POS concurrency tests |

---

## 4. Phase-by-Phase Remediation Plan

Following **PART 42 — DEVELOPMENT EXECUTION ORDER**:

### Phase 1: Audit and Stabilization (Immediate)
1. Fix authentication:
   - Disambiguate email across tenants; add secure password verification.
   - Enforce strong password hashing (bcrypt/scrypt), eliminate default 'password' fallback.
   - Implement rate limiting (`express-rate-limit`) on `/api/auth/login`.
2. Fix Transactional POS Sales & Inventory:
   - Authoritative backend recalculation of price, tax, discount, and totals in `saleService.js`.
   - Prevent race conditions and negative inventory via atomic database transactions / atomic operations.
   - Add idempotency keys to checkout requests.
3. Fix lint errors in client code (`Navbar.jsx`, cascading `useEffect` state updates).
4. Establish automated testing harness (Jest / Vitest / Supertest) with baseline tests for Auth, Tenant Isolation, and POS Transaction Integrity.

### Phase 2: Complete Core POS & Business Operations
1. Complete `Sales.jsx`: Searchable sales history, receipt reprint, refund/void modal.
2. Complete `Purchases.jsx`: Supplier management, purchase orders, goods receipt notes.
3. Complete `Expenses.jsx`: Expense categories, expense recording, payment method association.
4. Upgrade POS Screen: Fast barcode input, product search, customer selection, discounts, split payment modal, cash register shift tracking.
5. Authoritative decimal calculation layer.

### Phase 3: SaaS Control Center & Feature Activation Engine
1. Centralized Feature Registry: Model all features, dependencies, and industry presets in database and code.
2. Super Admin Enhancements: Complete business onboarding form, status lifecycle (`TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`, `ARCHIVED`), usage limits enforcement, platform audit logs.
3. Dynamic Frontend Sidebar and route protection adhering strictly to active features and user permissions.

### Phase 4: Multi-Branch and Finance
1. Multi-branch & Multi-warehouse schema and APIs.
2. Customer credit management, supplier payment reconciliation, receivables and payables.
3. Server-side aggregated reporting (Daily, Weekly, Monthly, Sales by Category/Cashier/Branch, Inventory Valuation, Profit & Loss).

### Phase 5: Industry Modules
1. Restaurant & Café Module: Tables, floor plan, KDS, order status tracking.
2. Service Center / Repair Management: Job cards, device diagnostic, parts consumption.
3. Salon & Appointment Management: Stylist schedules, booking calendar.
4. Pharmacy Capabilities: Batch/expiry alerts, prescription requirements.
5. Wholesale & Distribution: Tiered pricing, delivery notes.
6. HRM & Employee Management: Shifts, attendance, payroll calculations.

### Phase 6: Advanced Capabilities
1. Offline POS support architecture with local caching and reconciliation.
2. Notifications system (in-app, low-stock alerts, subscription renewal reminders).
3. Localization & multi-currency framework (LKR, USD, EUR, GBP, INR).

### Phase 7: Commercial Hardening
1. Full test coverage: tenant isolation, concurrent checkouts, role escalation rejection.
2. Documentation completion (all 16 required docs).
3. Production deployment configuration and health checks.

