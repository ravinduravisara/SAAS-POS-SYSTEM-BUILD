# Universal SaaS POS + ERP — Role-Based Access Control (RBAC)

## 1. User Roles

The platform enforces role-based authorization across two distinct administrative domains:
1. **Platform Level**: SaaS Operator (`superadmin`).
2. **Tenant Workspace Level**: Business personnel (`admin`, `manager`, `cashier`, `technician`, `stylist`).

---

## 2. Permissions Matrix

| Capability / Module | Super Admin | Tenant Admin | Store Manager | Cashier | Technician | Stylist |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Platform Tenants** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SaaS Metrics (MRR/ARR)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tenant Settings & Plan** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Users & Quotas** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Add / Edit Products** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Process POS Checkout** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve Sales Refunds** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Procurement (GRN)** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Business Expenses** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Financial Net Profit Report** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Restaurant KDS & Orders** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Repair Job Cards** | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Salon Appointments** | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **HRM & Payroll Slips** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Enforcement Implementation

### Backend Middleware
Routes utilize `roleMiddleware` (`server/src/middlewares/roleMiddleware.js`):
```javascript
const router = express.Router()
router.post('/users', auth, tenant, requireRole(['admin']), userController.createUser)
```

### Frontend UI Adaptation
The client dynamically hides or disables buttons and navigation links based on `user.role` stored in the Redux `authSlice`:
- Cashiers only see the POS terminal, Sales receipt history, and Customers.
- Technicians land directly on the Repair Jobs dashboard.
- Stylists land directly on the Salon Appointments calendar.

