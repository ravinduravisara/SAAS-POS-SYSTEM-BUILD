# Universal SaaS POS + ERP — Bug Fix Tracker

**Tracking Period**: October 2026  
**Status Key**: `OPEN`, `IN_PROGRESS`, `VERIFIED_FIXED`, `BLOCKED`  

---

## Bug Inventory & Resolution Matrix

| Bug ID | Module | File Location | Problem Description | Root Cause | Severity | Required Correction | Verification Method | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BUG-001** | Database | `server/src/config/db.js` | Unsafe fallback to in-memory store in production if Supabase drops | Silent catch block defaulted to `getInMemoryDb()` | **CRITICAL** | Strictly disallow mock fallback when `NODE_ENV === 'production'`; fail fast with 503 | Tested in Phase 6 test suite (`phase6_hardening.test.js`) - throws fatal error | `VERIFIED_FIXED` |
| **BUG-002** | POS / Inventory | `server/src/services/saleService.js` | Overselling on simultaneous checkouts due to `Math.max(0, ...)` | Non-atomic read-then-write of stock values without conditional lock | **CRITICAL** | Implement atomic conditional stock decrement (`stock >= qty`); reject overselling | Verified in `phase1.test.js` & `phase6_hardening.test.js` - throws 400 Insufficient Stock | `VERIFIED_FIXED` |
| **BUG-003** | POS / Checkout | `server/src/services/saleService.js` | Risk of orphan sale if items or payment inserts fail | Multi-query operations lacked rollback handling | **HIGH** | Wrap sale creation with error trapping and rollback of inserted records | Verified in `phase1.test.js` transaction safety tests | `VERIFIED_FIXED` |
| **BUG-004** | Restaurant | `server/src/modules/restaurant/restaurantService.js` | Client-supplied menu price trusted during order placement | Order creation directly read `item.price` from request payload | **CRITICAL** | Authoritatively resolve item prices from `products` table | Verified in `phase6_hardening.test.js` - malicious spoofed price overridden by catalog price | `VERIFIED_FIXED` |
| **BUG-005** | Restaurant | `server/src/modules/restaurant/restaurantService.js` | Idempotent GET `/tables` mutated DB by auto-seeding rows | `listTables` checked `data.length === 0` and executed `insert` | **MEDIUM** | Remove auto-seed from read endpoint; create dedicated setup route | Verified in `phase5.test.js` and `phase6_hardening.test.js` | `VERIFIED_FIXED` |
| **BUG-006** | POS UI | `client/src/pages/dashboard/POSScreen.jsx` | Missing POS keyboard shortcuts (F2, F4, F8, F9, Esc) | Keydown listeners were not bound to window | **MEDIUM** | Bind standard POS keybindings with preventDefault and focus/modal triggers | Verified in `POSScreen.jsx` & `CheckoutPanel.jsx` (F2 search focus, F8 hold, F9 payment, Esc close) | `VERIFIED_FIXED` |
| **BUG-007** | POS UI | `client/src/pages/dashboard/POSScreen.jsx` | Mobile view pushed cart completely out of viewport | Rigid two-column desktop grid without mobile drawer | **HIGH** | Implement responsive cart drawer with sticky checkout bar on mobile | Verified in `POSScreen.jsx` with mobile drawer Modal and sticky action bar | `VERIFIED_FIXED` |
| **BUG-008** | Navigation | `client/src/components/layout/Sidebar.jsx` | Sidebar lacked collapse toggle and branch selector | Fixed width layout without collapsed state or branch context | **LOW** | Add smooth expand/collapse toggle and active branch indicator | Verified in `Sidebar.jsx` with collapse state toggle and active store badge | `VERIFIED_FIXED` |
| **BUG-009** | Super Admin UI | `client/src/pages/superAdmin/TenantList.jsx` | Single monolithic business creation form caused fatigue | Unsegmented form fields | **MEDIUM** | Split into a 4-step wizard with review summary | Verified in `TenantList.jsx` (4-step stepper with instant validation and summary) | `VERIFIED_FIXED` |
| **BUG-010** | Components | `client/src/components/` | Inconsistent card and table styling across pages | Lack of standardized design tokens and reusable UI library | **MEDIUM** | Establish reusable design system (`StatCard`, `DataTable`, `EmptyState`, etc.) | Verified in `client/src/index.css` and all 12 dashboard pages & industry modules | `VERIFIED_FIXED` |

---

## Verification Summary
- **Total Cataloged Issues**: 10
- **Total Resolved & Verified**: 10 (100%)
- **Open / Blocked**: 0
- **Automated Verification**: 60 server integration tests passing across all 6 test suites (`npm --prefix server test`).
- **Client Lint Verification**: 0 ESLint errors and warnings across all client components (`npm --prefix client run lint`).
- **Production Bundle**: Clean build passing in 221ms (`npm --prefix client run build`).
