# Universal SaaS POS + ERP — Global Design System Specification

**Design Version**: 2.0 (Modern SaaS Minimalist)  
**Inspirations**: Stripe Dashboard, Linear, Shopify Admin  
**Design Principles**: Clarity, High Density, Predictable Interaction, Strict Visual Hierarchy  

---

## 1. Color Palette & Semantic Tokens

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `--bg` | `#F8FAFC` | Primary application canvas background |
| `--panel` | `#FFFFFF` | Elevated cards, tables, modal dialogs, and panels |
| `--text` | `#0F172A` | High-contrast primary headings, table text, numbers |
| `--muted` | `#64748B` | Secondary text, field descriptions, timestamps |
| `--border` | `#E2E8F0` | Subtle structural dividers and card borders |
| `--border-strong` | `#CBD5E1` | Inputs, interactive borders, and table headers |
| `--primary` | `#4F46E5` | Primary brand accent (Indigo 600) |
| `--primary-hover`| `#4338CA` | Hover state for buttons and active link indicators |
| `--primary-light`| `#EEF2FF` | Active navigation background, highlights |
| `--success` | `#16A34A` | Completed transactions, paid invoices, in-stock badges |
| `--success-light`| `#DCFCE7` | Subtle background for success badges and alerts |
| `--warning` | `#D97706` | Pending, draft, under inspection, preparing states |
| `--warning-light`| `#FEF3C7` | Warning badge surface |
| `--danger` | `#DC2626` | Destructive actions, suspended tenants, voided sales |
| `--danger-light` | `#FEE2E2` | Danger badge surface |

---

## 2. Typography Scale

- **Font Family**: `Inter, system-ui, -apple-system, sans-serif`
- **Heading 1 (`.h1`)**: 26px / 1.2 line-height, -0.4px letter-spacing, bold (700)
- **Heading 2 (`.h2`)**: 18px / 1.3 line-height, -0.2px letter-spacing, semibold (650)
- **Heading 3 (`.h3`)**: 16px / 1.4 line-height, semibold (600)
- **Body (`.text`)**: 14px (0.875rem) / 1.5 line-height, regular (400)
- **Caption / Secondary (`.muted`)**: 13px (0.8125rem) / 1.4 line-height, medium (500)
- **Financial Figures**: Tabular numbers (`font-variant-numeric: tabular-nums`) with currency prefix

---

## 3. Core Component Library

### `StatCard` (`client/src/components/common/StatCard.jsx`)
- Metric displays for dashboards with upper-case title, 28px bold value, and optional positive/negative trend pill.

### `DataTable` (`client/src/components/common/DataTable.jsx`)
- Uniform data table with search bar, loading skeleton fallback, empty state placeholder, and pagination controls.

### `StatusBadge` (`client/src/components/common/StatusBadge.jsx`)
- Semantic status pills with a colored dot indicator for quick status scanning.

### `Modal` & `ConfirmDialog` (`client/src/components/common/Modal.jsx`, `ConfirmDialog.jsx`)
- Accessible modal dialogs with backdrop blur (`backdrop-filter: blur(4px)`), keyboard `Escape` closing, focus traps, and destructive confirmation handling.

### `LoadingSkeleton` & `EmptyState` (`client/src/components/common/LoadingSkeleton.jsx`, `EmptyState.jsx`)
- Eliminates jarring layout shifts during data loading and provides informative empty state illustrations with action buttons.

