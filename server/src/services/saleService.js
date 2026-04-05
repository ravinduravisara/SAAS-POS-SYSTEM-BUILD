const { getSupabase } = require('../config/db')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('sales')
		.select('*, sale_items(*)')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map((sale) => ({
		id: sale.id,
		tenantId: sale.tenant_id,
		createdAt: sale.created_at,
		totals: {
			subtotal: Number(sale.subtotal || 0),
			total: Number(sale.total || 0),
			itemsCount: Number(sale.items_count || 0),
		},
		payment: {
			method: sale.payment_method,
			paid: Number(sale.payment_paid || 0),
		},
		items: (sale.sale_items || []).map((item) => ({
			id: item.id,
			productId: item.product_id,
			name: item.name,
			price: Number(item.price || 0),
			quantity: Number(item.quantity || 0),
		})),
	}))
}

async function create(tenantId, payload) {
	const db = getSupabase()
	const totals = payload.totals || {}
	const payment = payload.payment || {}

	const { data: sale, error: saleError } = await db
		.from('sales')
		.insert({
			tenant_id: tenantId,
			subtotal: Number(totals.subtotal || 0),
			total: Number(totals.total || 0),
			items_count: Number(totals.itemsCount || 0),
			payment_method: payment.method || 'cash',
			payment_paid: Number(payment.paid || totals.total || 0),
		})
		.select()
		.single()
	if (saleError) throw saleError

	const saleItems = (payload.items || []).map((item) => ({
		sale_id: sale.id,
		tenant_id: tenantId,
		product_id: item.productId,
		name: item.name,
		price: Number(item.price || 0),
		quantity: Number(item.quantity || 1),
	}))

	if (saleItems.length > 0) {
		const { error: itemsError } = await db.from('sale_items').insert(saleItems)
		if (itemsError) throw itemsError
	}

	for (const item of payload.items || []) {
		const { data: product, error: productError } = await db
			.from('products')
			.select('id, stock')
			.eq('id', item.productId)
			.eq('tenant_id', tenantId)
			.single()
		if (productError && productError.code !== 'PGRST116') throw productError
		if (product) {
			const newStock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0))
			const { error: stockError } = await db
				.from('products')
				.update({ stock: newStock })
				.eq('id', item.productId)
				.eq('tenant_id', tenantId)
			if (stockError) throw stockError

			const { error: logError } = await db
				.from('inventory_logs')
				.insert({ tenant_id: tenantId, product_id: item.productId, type: 'sale', delta: -Number(item.quantity || 0), note: `Sale ${sale.id}` })
			if (logError) throw logError
		}
	}

	return {
		id: sale.id,
		tenantId,
		createdAt: sale.created_at,
		totals: {
			subtotal: Number(sale.subtotal || 0),
			total: Number(sale.total || 0),
			itemsCount: Number(sale.items_count || 0),
		},
		payment: {
			method: sale.payment_method,
			paid: Number(sale.payment_paid || 0),
		},
		items: payload.items || [],
	}
}

module.exports = { list, create }
