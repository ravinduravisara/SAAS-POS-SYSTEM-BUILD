# Universal SaaS POS + ERP — Automated Testing Guide

## 1. Test Architecture

The platform uses Node.js 20's native test runner (`node:test`, `node:assert`) coupled with `supertest` for end-to-end API integration and security verification.

All tests execute hermetically using `inMemoryDb.js`, allowing lightning-fast test execution (~700ms for 53 tests) without external network dependencies.

---

## 2. Running Automated Tests

### Run All Test Suites
```bash
npm --prefix server test
```

### Run Specific Test Suite
```bash
node --test server/tests/phase1.test.js
node --test server/tests/phase2.test.js
node --test server/tests/phase3.test.js
node --test server/tests/phase4.test.js
node --test server/tests/phase5.test.js
```

---

## 3. Test Suites Overview

### Phase 1: Security & Core Stabilization (`phase1.test.js` - 14 tests)
- Authentication: Wrong password rejection, non-existent email rejection, `/auth/me` token inspection, forged JWT rejection.
- Logical Isolation: Cross-tenant product isolation, unauthorized updates, unauthorized deletes.
- Transactional Integrity: Authoritative price recalculation, out-of-stock rejection, idempotency key deduplication, returns & inventory restocking.
- Plan Quotas: Max user limits enforcement.

### Phase 2: Procurement & Workflows (`phase2.test.js` - 7 tests)
- Supplier creation & listing.
- Goods Received Notes (GRN) receiving & automated inventory balance increment.
- Operating business expense recording, categorization, and deletion.

### Phase 3: SaaS Control Center & Gating (`phase3.test.js` - 10 tests)
- Master Feature Registry & Industry Presets inspection.
- Commercial onboarding with custom resource quotas.
- Dynamic feature activation and immediate route gating (`403 FEATURE_DISABLED`).
- Tenant lifecycle state enforcement (`SUSPENDED` -> rejected; `ACTIVE` -> restored).

### Phase 4: Multi-Branch & Finance Reporting (`phase4.test.js` - 5 tests)
- Multi-branch listing & quota enforcement (`max_branches` = 2).
- Financial analytics: Revenue, COGS, Net Profit, and payment breakdown calculations.
- Sales ledger export as standard CSV stream.

### Phase 5: Industry ERP Modules (`phase5.test.js` - 17 tests)
- **Restaurant**: Floor layout, table occupancy, waiter order creation, KDS live board, table release upon payment.
- **Service Center / Repairs**: Diagnostic job cards, cost breakdown, status progression to `completed` with automatic spare parts inventory deduction and audit logging.
- **Salon**: Stylists and services catalog, appointment booking, double-booking prevention with HTTP 409 Conflict, status updates.
- **HRM**: Staff directory, daily attendance check-in, monthly payroll computation with bonuses and deductions, salary disbursement.
- **Plan Entitlement Gates**: Enforces HTTP 403 Forbidden on all industry modules for Starter plan tenants.

