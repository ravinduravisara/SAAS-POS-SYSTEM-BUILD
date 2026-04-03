const { store, id } = require('../data/store')

async function list() {
	return store.purchases
}

async function create(payload) {
	const purchase = {
		id: id('pu'),
		createdAt: new Date().toISOString(),
		supplier: payload.supplier || null,
		items: payload.items || [],
		total: Number(payload.total || 0),
	}

	// Increment stock
	for (const item of purchase.items) {
		const product = store.products.find((p) => p.id === item.productId)
		if (product) {
			product.stock = Number(product.stock || 0) + Number(item.quantity || 0)
		}
	}

	store.purchases.unshift(purchase)
	return purchase
}

module.exports = { list, create }
