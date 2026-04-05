const { getSupabase } = require('../config/db')

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
		supplier: purchase.supplier,
		total: Number(purchase.total || 0),
		items: purchase.items || [],
		createdAt: purchase.created_at,
	}))
}

async function create(tenantId, payload) {
	const db = getSupabase()
	const { data, error } = await db
		.from('purchases')
		.insert({
			tenant_id: tenantId,
			supplier: payload.supplier || null,
			total: Number(payload.total || 0),
			items: payload.items || [],
		})
		.select()
		.single()
	if (error) throw error

	for (const item of payload.items || []) {
		const { data: rows, error: productError } = await db
			.from('products')
			.select('id, stock')
			.eq('id', item.productId)
			.eq('tenant_id', tenantId)
			.limit(1)
		if (productError) throw productError
		const product = rows?.[0]
		if (product) {
			const newStock = Number(product.stock || 0) + Number(item.quantity || 0)
			const { error: stockError } = await db
				.from('products')
				.update({ stock: newStock })
				.eq('id', item.productId)
				.eq('tenant_id', tenantId)
			if (stockError) throw stockError

			const { error: logError } = await db
				.from('inventory_logs')
				.insert({ tenant_id: tenantId, product_id: item.productId, type: 'purchase', delta: Number(item.quantity || 0), note: `Purchase ${data.id}` })
			if (logError) throw logError
		}
	}

	return {
		id: data.id,
		tenantId: data.tenant_id,
		supplier: data.supplier,
		total: Number(data.total || 0),
		items: data.items || [],
		createdAt: data.created_at,
	}
}

module.exports = { list, create }
