# Universal SaaS POS + ERP — Feature Registry & Industry Presets

## 1. Feature Registry Design

The platform uses a centralized feature registry located at `shared/constants/features.js`.
Every commercial feature is represented by a unique namespaced key (e.g. `pos.core`, `restaurant.kitchenDisplay`).

### Resolution Algorithm
Features are resolved dynamically using `server/src/utils/featureResolver.js`:
```
Effective Features = (Plan Defaults ∪ Preset Inclusions ∪ Tenant Overrides) - Explicit Denials - Unmet Dependencies
```

---

## 2. Master Feature Catalog

| Feature Key | Category | Name | Default Plans | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `pos.core` | Point of Sale | POS Terminal Core | Starter, Pro, Enterprise | None |
| `pos.returns` | Point of Sale | Returns & Refunds | Pro, Enterprise | `pos.core` |
| `pos.splitPayments` | Point of Sale | Split Payments (Cash/Card) | Starter, Pro, Enterprise | `pos.core` |
| `pos.holdResume` | Point of Sale | Hold & Resume Transactions | Starter, Pro, Enterprise | `pos.core` |
| `inventory.core` | Inventory & Stock | Products & Categories | Starter, Pro, Enterprise | None |
| `inventory.batchTracking` | Inventory & Stock | Batch & Expiry Tracking | Enterprise | `inventory.core` |
| `sales.history` | Sales & Invoicing | Sales Ledger & Invoices | Starter, Pro, Enterprise | `pos.core` |
| `purchases.core` | Procurement | Suppliers & GRN Restock | Pro, Enterprise | `inventory.core` |
| `finance.expenses` | Finance & Accounting | Expense Tracking | Pro, Enterprise | None |
| `reports.advanced` | Finance & Accounting | Reporting & Analytics | Pro, Enterprise | None |
| `restaurant.core` | Restaurant | Table Management & Floor Layout | Enterprise | `pos.core` |
| `restaurant.kitchenDisplay` | Restaurant | Kitchen Display System (KDS) | Enterprise | `restaurant.core` |
| `repairs.jobCards` | Service Center | Repair Jobs & Diagnostics | Enterprise | `inventory.core` |
| `salon.appointments` | Salon | Stylists & Appointments | Enterprise | `pos.core` |
| `hrm.core` | HRM | Employee Directory & Attendance | Enterprise | None |
| `hrm.payroll` | HRM | Monthly Payroll & Slips | Enterprise | `hrm.core` |

---

## 3. Industry Presets Catalog

When onboarding a new business, Super Admins can select an Industry Preset to automatically provision the optimal bundle of enabled modules:

### Retail Store / Boutique (`retail`)
- `pos.core`, `pos.returns`, `pos.splitPayments`, `pos.holdResume`
- `inventory.core`, `sales.history`, `purchases.core`, `finance.expenses`, `reports.advanced`

### Supermarket / Grocery (`supermarket`)
- All retail features + `inventory.batchTracking`

### Restaurant / Café / Bar (`restaurant`)
- Core POS + `restaurant.core`, `restaurant.kitchenDisplay`, `purchases.core`, `finance.expenses`, `reports.advanced`

### Service Center & Electronics Repair (`repairs`)
- Core POS + `inventory.core`, `repairs.jobCards`, `purchases.core`, `finance.expenses`, `reports.advanced`

### Salon / Spa & Aesthetics (`salon`)
- Core POS + `salon.appointments`, `finance.expenses`, `reports.advanced`, `hrm.core`

### Pharmacy & Health (`pharmacy`)
- Supermarket features + `pharmacy.core`, `inventory.batchTracking`

### Conglomerate / All Modules (`all`)
- Grants access to all modules simultaneously.

