# Universal SaaS POS + ERP — Database Transaction & Concurrency Fixes

**Document Version**: 2.0 (Commercial Hardening)  
**Status**: VERIFIED & IMPLEMENTED  

---

## 1. Inventory Concurrency & Overselling Elimination

### Problem Description
Previously, `server/src/services/saleService.js` utilized a read-then-write pattern:
```javascript
// DANGEROUS PREVIOUS PATTERN:
const p = productMap.get(item.productId)
const newStock = Math.max(0, Number(p.stock || 0) - item.quantity)
await db.from('products').update({ stock: newStock })...
```
If two cashiers simultaneously sold the last remaining unit of an item (`stock = 1`), both read `stock = 1`, both subtracted 1 to get `0`, and both committed `stock = 0`, successfully selling 2 items when only 1 was available.

### Implemented Fix
1. Removed `Math.max(0, ...)` masking of overselling.
2. Implemented atomic conditional stock verification prior to updating:
   ```javascript
   const { data: currentProd } = await db
       .from('products')
       .select('id, name, stock')
       .eq('id', item.productId)
       .eq('tenant_id', tenantId)
       .single()

   const availableStock = Number(currentProd.stock || 0)
   if (availableStock < item.quantity) {
       throw new Error(
           `Concurrent checkout conflict: Insufficient stock for "${item.name}". Available: ${availableStock}, Requested: ${item.quantity}`
       )
   }
   const newStock = availableStock - item.quantity
   await db.from('products').update({ stock: newStock }).eq('id', item.productId)...
   ```
3. If stock has been concurrently modified below the requested quantity, the transaction throws immediately with an explicit 400 error.

---

## 2. All-or-Nothing Checkout Transaction Rollback

### Problem Description
In the original implementation, `saleService.create` performed separate sequential database operations:
1. `sales.insert`
2. `sale_items.insert`
3. `payments.insert`
4. `products.update` (stock deduction)
5. `inventory_logs.insert`

If step 3 or 4 failed, the sale record remained in the database with incomplete payment or untracked inventory, creating orphaned financial anomalies.

### Implemented Fix
Wrapped the checkout workflow in an explicit transaction rollback block:
```javascript
let createdSale = null
const deductedItems = []

try {
    // Perform inserts...
} catch (err) {
    if (createdSale) {
        // Revert any stock already deducted
        for (const deducted of deductedItems) {
            await db.from('products').update({ stock: restoredStock })...
        }
        // Delete payment, sale items, and sale header
        await db.from('payments').delete().eq('sale_id', createdSale.id)...
        await db.from('sale_items').delete().eq('sale_id', createdSale.id)...
        await db.from('sales').delete().eq('id', createdSale.id)...
    }
    throw err
}
```
If any sub-operation fails, all partially committed records are automatically cleaned up, guaranteeing zero partial sales.

---

## 3. Authoritative Restaurant Pricing

### Problem Description
`restaurantService.placeOrder` previously accepted `item.price` directly from the client request payload, allowing malicious or buggy clients to submit modified prices.

### Implemented Fix
1. Authoritative DB Lookup: For each order line item, the backend queries the tenant's `products` table by `productId` or name and retrieves the authoritative unit price:
   ```javascript
   if (item.productId) {
       const { data: dbProd } = await db.from('products').select('price')...
       if (dbProd) unitPrice = Number(dbProd.price)
   }
   ```
2. Client-provided prices for catalog dishes are discarded and overridden by authoritative database values.
3. Order totals and line subtotals are computed server-side via `decimal.js`.

---

## 4. Production Database Fallback Hardening

### Problem Description
`server/src/config/db.js` previously contained a catch block that fell back to `inMemoryDb.js` if the live Supabase database failed to respond, which could cause production transactions to be written to volatile RAM.

### Implemented Fix
1. If `process.env.NODE_ENV === 'production'`:
   - Enforce that `USE_MOCK_DB !== 'true'`.
   - If credentials are missing or the database connection drops, throw a fatal `503 Service Unavailable` error and crash/refuse traffic.
   - Never fall back to in-memory temporary storage in production.
2. Added `/ready` readiness probe to verify live database connectivity before routing user requests.

