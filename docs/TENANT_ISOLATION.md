# Universal SaaS POS + ERP — Multi-Tenant Data Isolation Architecture

## 1. Zero-Trust Tenant Context

In multi-tenant SaaS environments, client-supplied tenant identifiers (e.g. `req.body.tenantId` or `req.headers['x-tenant-id']`) represent untrusted input that must **never** be used for data partitioning.

### Request Flow & Resolution
1. **Client Request**: Sends HTTPS request with `Authorization: Bearer <JWT>`.
2. **`authMiddleware`**: Decodes and verifies the signature of the JWT using `JWT_SECRET`. Extracts `req.user = { id, tenantId, role }`.
3. **`tenantMiddleware`**:
   - Queries `tenants` table by `req.user.tenantId`.
   - Rejects missing or non-existent tenants with HTTP 404.
   - Evaluates tenant operational status (`suspended`, `expired`).
   - Sets `req.tenantId = tenant.id` and `req.tenant = tenant`.
4. **Service Execution**: All subsequent business services strictly bind queries to `req.tenantId`.

```javascript
// Example: Strict tenant scoping in saleService.js
const { data, error } = await db
    .from('sales')
    .select('*, sale_items(*)')
    .eq('tenant_id', tenantId) // Always enforced server-side
```

---

## 2. Cross-Tenant Defense Mechanisms

### A. Route Isolation
No tenant user can access another tenant's entity by guessing or providing another tenant's UUID:
- If Tenant A attempts to update or delete a product belonging to Tenant B:
  `UPDATE products SET name = 'Hacked' WHERE id = 'prod_tenant_b' AND tenant_id = 'tenant_a'`
  Result: 0 rows affected. The backend returns 404 Not Found.

### B. Foreign Key Referential Integrity
All child entities (`sale_items`, `payments`, `inventory_logs`, `restaurant_orders`) enforce `tenant_id` and foreign key references back to the tenant record, preventing orphaned or leaked cross-tenant references.

---

## 3. Verification & Automated Isolation Tests

Cross-tenant isolation is verified continuously in `server/tests/phase1.test.js`:
- **Scenario A**: Tenant A registers products (`Alpha-01`). Tenant B registers products (`Beta-01`).
- **Test 1**: Tenant A queries `/api/products` -> only receives `Alpha-01`.
- **Test 2**: Tenant B queries `/api/products` -> only receives `Beta-01`.
- **Test 3**: Tenant A attempts `PUT /api/products/p_beta` -> returns HTTP 404.
- **Test 4**: Tenant A attempts `DELETE /api/products/p_beta` -> returns HTTP 404.

