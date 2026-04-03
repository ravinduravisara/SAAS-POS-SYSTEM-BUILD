const { store } = require('../data/store')

async function summary() {
	const revenue = store.sales.reduce((sum, s) => sum + Number(s.totals?.total || 0), 0)
	const sales = store.sales.length

	const productCounts = new Map()
	for (const sale of store.sales) {
		for (const item of sale.items || []) {
			productCounts.set(
				item.productId,
				(productCounts.get(item.productId) || 0) + Number(item.quantity || 0),
			)
		}
	}

	const topProducts = [...productCounts.entries()]
		.map(([productId, qty]) => {
			const p = store.products.find((x) => x.id === productId)
			return { productId, name: p?.name || productId, quantity: qty }
		})
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, 5)

	return { revenue, sales, topProducts }
}

module.exports = { summary }
