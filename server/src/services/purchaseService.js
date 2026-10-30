const { getSupabase } = require('../config/db')
const { round, multiply, add } = require('../../../shared/utils/decimal')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('purchases')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map((purchase) => ({
		id: purchase.id,
		tenantId: purchase.tenant_id,
		supplierId: purchase.supplier_id || null,
		supplierName: purchase.supplier_name || purchase.supplier || 'General Supplier',
		status: purchase.status || 'received',
		total: Number(purchase.total || 0),
		items: purchase.items || [],
		notes: purchase.notes || '',
		createdAt: purchase.created_at,
	}))
}

async function create(tenantId, payload) {
	const db = getSupabase()
	const rawItems = Array.isArray(payload.items) ? payload.items : []
	if (rawItems.length === 0) {
		const err = new Error('Purchase must include at least one item')
		err.status = 400
		throw err
	}

	// 1. Resolve Supplier
	let supplierName = payload.supplierName || payload.supplier || 'General Supplier'
	let supplierId = payload.supplierId || null
	if (supplierId) {
		const { data: supplier } = await db
			.from('suppliers')
			.select('id, name')
			.eq('id', supplierId)
			.eq('tenant_id', tenantId)
			.maybeSingle()
		if (supplier) {
			supplierName = supplier.name
		}
	}

	// 2. Authoritatively calculate items and purchase total
	let total = 0
	const calculatedItems = []

	for (const item of rawItems) {
		const qty = Math.max(1, parseInt(item.quantity, 10) || 1)
		const costPrice = Math.max(0, Number(item.costPrice || item.price || 0))
		const lineTotal = multiply(costPrice, qty)
		total = add(total, lineTotal)

		calculatedItems.push({
			productId: item.productId,
			name: item.name || 'Product',
			quantity: qty,
			costPrice: round(costPrice, 2),
			total: round(lineTotal, 2),
		})
	}

	// 3. Insert Purchase Record
	const { data, error } = await db
		.from('purchases')
		.insert({
			tenant_id: tenantId,
			supplier_id: supplierId,
			supplier_name: supplierName,
			supplier: supplierName, // Keep backward compatibility with legacy column
			status: 'received',
			total: round(total, 2),
			items: calculatedItems,
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error

	// 4. Update Product Stock and Log Inventory
	for (const item of calculatedItems) {
		if (!item.productId) continue
		const { data: prod } = await db
			.from('products')
			.select('id, stock, cost_price')
			.eq('id', item.productId)
			.eq('tenant_id', tenantId)
			.maybeSingle()

		if (prod) {
			const newStock = Number(prod.stock || 0) + item.quantity
			await db
				.from('products')
				.update({
					stock: newStock,
					cost_price: item.costPrice > 0 ? item.costPrice : prod.cost_price,
				})
				.eq('id', item.productId)
				.eq('tenant_id', tenantId)

			await db.from('inventory_logs').insert({
				tenant_id: tenantId,
				product_id: item.productId,
				type: 'purchase',
				delta: item.quantity,
				note: `Goods Receipt: Purchase #${data.id} from ${supplierName}`,
			})
		}
	}

	return {
		id: data.id,
		tenantId: data.tenant_id,
		supplierId,
		supplierName,
		status: 'received',
		total: round(total, 2),
		items: calculatedItems,
		notes: payload.notes || '',
		createdAt: data.created_at,
	}
}

module.exports = { list, create }
