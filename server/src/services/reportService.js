const { getSupabase } = require('../config/db')

async function summary(tenantId) {
	const db = getSupabase()
	const { data: sales, error } = await db
		.from('sales')
		.select('total, sale_items(product_id, name, quantity)')
		.eq('tenant_id', tenantId)
	if (error) throw error

	const revenue = (sales || []).reduce((sum, sale) => sum + Number(sale.total || 0), 0)
	const salesCount = (sales || []).length

	const productCounts = new Map()
	for (const sale of sales || []) {
		for (const item of sale.sale_items || []) {
			productCounts.set(item.product_id, {
				name: item.name,
				quantity: (productCounts.get(item.product_id)?.quantity || 0) + Number(item.quantity || 0),
			})
		}
	}

	const topProducts = [...productCounts.entries()]
		.map(([productId, value]) => ({ productId, name: value.name, quantity: value.quantity }))
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, 5)

	return { revenue, sales: salesCount, topProducts }
}

module.exports = { summary }
