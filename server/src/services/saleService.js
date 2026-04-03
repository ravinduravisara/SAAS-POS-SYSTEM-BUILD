const { store, id } = require('../data/store')

async function list() {
	return store.sales
}

async function create(payload) {
	const sale = {
		id: id('s'),
		createdAt: new Date().toISOString(),
		items: payload.items || [],
		totals: payload.totals || { subtotal: 0, total: 0, itemsCount: 0 },
		payment: payload.payment || { method: 'cash', paid: payload.totals?.total || 0 },
	}

	// Decrement stock
	for (const item of sale.items) {
		const product = store.products.find((p) => p.id === item.productId)
		if (product) {
			product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0))
		}
	}

	store.sales.unshift(sale)
	return sale
}

module.exports = { list, create }
