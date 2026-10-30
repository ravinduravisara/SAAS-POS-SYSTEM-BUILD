# Universal SaaS POS + ERP Platform

A scalable, secure, modern commercial multi-tenant SaaS POS + ERP platform designed to support diverse business verticals—including retail shops, supermarkets, restaurants, electronic service centers, beauty salons, and professional service organizations—from a single unified codebase.

---

## 🌟 Key Features

### 🏢 Multi-Tenant SaaS Architecture
- **Logical Data Isolation**: Strict server-side tenant scoping on every query (`eq('tenant_id', ...)`) with zero client-side tenant trust.
- **Tenant Disambiguation**: Multi-tenant email resolution allowing single identities across distinct business accounts.
- **Operational Lifecycle**: Automated enforcement of business states (`TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`, `ARCHIVED`).
- **Resource Quotas**: Authoritative backend enforcement of plan limits (`maxUsers`, `maxBranches`, `maxProducts`).

### 💳 Modern Point of Sale (POS) Terminal
- **Authoritative Calculations**: Decimal-safe pricing, multi-tier discounts, and taxes computed exclusively on the backend (`shared/utils/decimal.js`).
- **Hardware Integration**: Barcode scanner input handling, category pills navigation, and instant search.
- **Transaction Safety**: `Idempotency-Key` deduplication, atomic stock checks, and concurrency protection.
- **Cart Management**: Park cart / Hold sale & resume transactions anytime without losing active items.
- **Split & Mixed Payments**: Multi-tender support (cash, card, bank transfer) with exact change computation.
- **Receipts & Refunds**: Full receipt printing, historical sales audit ledger, and item return restocking.

### 📦 Procurement & Inventory (GRN)
- **Supplier Directory**: Contact details, tax IDs, and vendor ledgers.
- **Goods Received Notes (GRN)**: Purchase order receiving with automatic inventory stock balance increment.
- **Stock Movements Ledger**: Continuous audit trail in `inventory_logs` for all sales, purchases, adjustments, and repairs.

### 📊 Financial Analytics & Multi-Branch
- **Multi-Branch Management**: Independent outlets with designated primary branch quotas.
- **Aggregated Financials**: Revenue, Net Profit, COGS, tax liabilities, and payment method breakdowns.
- **CSV Ledger Export**: Standard downloadable sales transactions export stream.
- **Operating Expenses**: Categorized business expense tracking (rent, utilities, petty cash).

### 🚀 Specialized Industry ERP Modules
- **Restaurant & KDS (`restaurant.core`, `restaurant.kitchenDisplay`)**: Dining floor plans, table occupancy (`available`/`occupied`), waiter order routing, and real-time Kitchen Display System.
- **Service Center & Electronics Repairs (`repairs.jobCards`)**: Device diagnostic job cards, IMEI/serial tracking, technician assignment, and automated spare parts inventory consumption.
- **Salon & Aesthetics Appointments (`salon.appointments`)**: Stylist schedules, services catalog, and double-booking conflict prevention with HTTP 409 Conflict.
- **HRM & Payroll (`hrm.core`, `hrm.payroll`)**: Staff roster, daily clock-in attendance logging, and decimal-safe monthly payroll salary disbursement.

### 🛡️ SaaS Super Admin Control Center
- **SaaS Business Metrics**: Real-time Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), and active tenant distributions.
- **Commercial Onboarding**: Instant workspace provisioning with industry presets and custom resource quotas.
- **Centralized Feature Registry**: Database-driven feature activation engine with dependency tree validation.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, React Router v7, Redux Toolkit, Axios
- **Backend**: Node.js 20+, Express 5, Helmet, Express Rate Limit, PBKDF2 with Salt hashing
- **Database**: PostgreSQL (Supabase client) + Hermetic In-Memory PostgreSQL provider for tests
- **Testing**: Node.js native test runner (`node:test`, `node:assert`, `supertest`) — 53 passing automated tests

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20.0.0+ and npm 10.0.0+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/ravinduravisara/SAAS-POS-SYSTEM-BUILD.git
cd SAAS-POS-SYSTEM-BUILD

# Install dependencies
npm --prefix server install
npm --prefix client install
```

### 3. Running Automated Tests
```bash
npm --prefix server test
```
All 53 automated unit and integration tests across 5 phases will execute hermetically:
```
✔ PHASE 1: Core SaaS POS + ERP Stabilization Tests (14 tests)
✔ PHASE 2: Core POS & Business Workflows Tests (7 tests)
✔ PHASE 3: SaaS Control Center & Feature Activation Engine Tests (10 tests)
✔ PHASE 4: Multi-Branch & Finance Reporting Tests (5 tests)
✔ PHASE 5: Industry Modules (Restaurant, Repairs, Salon, HRM) Tests (17 tests)
Total: 53 tests passed (0 failures, 100% pass rate)
```

### 4. Running the Development Servers
In two separate terminals:

```bash
# Start backend API (http://localhost:5000)
npm run dev:server
```

```bash
# Start frontend client (http://localhost:5173)
npm run dev:client
```

### 5. Production Build & Lint Verification
```bash
# Verify client lint
npm --prefix client run lint

# Compile production build
npm --prefix client run build
```

---

## 📚 Complete Documentation Suite

For comprehensive technical architecture, schema definitions, and operating manuals, consult the documentation in `docs/`:

1. [Project Audit](docs/PROJECT_AUDIT.md) — Comprehensive technical audit of repository components and gaps.
2. [Implementation Progress](docs/IMPLEMENTATION_PROGRESS.md) — Complete status log across all 7 implementation phases.
3. [System Architecture](docs/ARCHITECTURE.md) — Architectural overview, data flows, and micro-modular separation.
4. [Database Schema](docs/DATABASE_SCHEMA.md) — Relational schema, tables, foreign keys, and indexes.
5. [API Documentation](docs/API_DOCUMENTATION.md) — Full REST API endpoint reference and error formats.
6. [Feature Registry](docs/FEATURE_REGISTRY.md) — Master feature registry keys, categories, dependencies, and presets.
7. [Subscription System](docs/SUBSCRIPTION_SYSTEM.md) — Pricing tiers, quota limits, and lifecycle states.
8. [Tenant Isolation](docs/TENANT_ISOLATION.md) — Zero-trust multi-tenant data isolation architecture.
9. [Role-Based Access Control](docs/ROLE_PERMISSIONS.md) — RBAC matrix and role permissions.
10. [Production Deployment](docs/DEPLOYMENT.md) — Docker, environment variables, and CDN configuration.
11. [Environment Setup](docs/ENVIRONMENT_SETUP.md) — Local development and database setup.
12. [Automated Testing](docs/TESTING.md) — Integration test suites, test runners, and assertions.
13. [Security Architecture](docs/SECURITY.md) — Threat model, password hashing, and rate limiting.
14. [User Guide](docs/USER_GUIDE.md) — POS checkout, purchases, expenses, and returns guide.
15. [Super Admin Guide](docs/SUPER_ADMIN_GUIDE.md) — SaaS platform operator manual and onboarding workflows.
16. [Industry ERP Modules](docs/INDUSTRY_MODULES.md) — Restaurant KDS, Repairs, Salon, and HRM guide.
17. [Offline POS & Sync](docs/OFFLINE_AND_SYNC.md) — Offline caching, local queue, and synchronization design.

---

## 📄 License
Commercial Multi-Tenant SaaS License. All rights reserved.
