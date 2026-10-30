# Universal SaaS POS + ERP — Super Admin Operating Guide

## 1. Accessing the Super Admin Control Center

1. Log in with your Super Administrator credentials at `/login`.
2. The platform automatically detects your `superadmin` role and routes you to `/super-admin`.

---

## 2. SaaS Metrics & Revenue Overview

The Super Admin Dashboard provides key subscription performance indicators:
- **Total Registered Tenants**: Count of all onboarded businesses.
- **Active Businesses**: Tenants with good standing subscriptions.
- **Trial Tenants**: Workspaces operating under active trial windows.
- **Monthly Recurring Revenue (MRR)**: Real-time recurring subscription run-rate.
- **Annual Recurring Revenue (ARR)**: Annualized subscription revenue.
- **Plan Distribution**: Breakdown across Starter, Professional, and Enterprise tiers.

---

## 3. Onboarding a New Commercial Tenant

1. Navigate to **Tenants** -> Click **+ Onboard Business**.
2. Complete business metadata:
   - **Business Name**: Legal entity name (e.g. "Royal Palm Restaurant").
   - **Business Email**: Primary administrator email.
   - **Subscription Plan**: Select `starter`, `pro`, or `enterprise`.
   - **Industry Preset**: Select `restaurant`, `repairs`, `salon`, `supermarket`, or `retail`.
   - **Resource Quotas**: Configure `Max Users`, `Max Branches`, and `Max Products`.
3. Click **Create Business**.
4. The system provisions the workspace, initializes default settings, configures module entitlements, and generates administrator login credentials.

---

## 4. Tenant Lifecycle Management

From the Tenant Details screen (`/super-admin/tenants/:id`), platform operators can:
- **Suspend Workspace**: Immediately blocks all operational writes and checkouts for delinquent accounts.
- **Reactivate Workspace**: Restores full normal operations.
- **Extend Trial**: Adds additional trial days for prospective commercial clients.
- **Feature Overrides**: Individually toggle specific modules (e.g. enable KDS or HRM) regardless of base plan tier.

