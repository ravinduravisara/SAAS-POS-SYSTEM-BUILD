const { store } = require('../data/store')

async function list() {
	return store.products.map((p) => ({
		id: p.id,
		name: p.name,
		price: p.price,
		sku: p.sku,
		stock: Number(p.stock || 0),
		categoryId: p.categoryId,
	}))
}

async function setStock(productId, stock) {
	const product = store.products.find((p) => p.id === productId)
	if (!product) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}
	const nextStock = Number(stock)
	if (!Number.isFinite(nextStock) || nextStock < 0) {
		const err = new Error('Invalid stock value')
		err.status = 400
		throw err
	}
	product.stock = nextStock
	return product
}

async function adjustStock(productId, delta) {
	const product = store.products.find((p) => p.id === productId)
	if (!product) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}
	product.stock = Math.max(0, Number(product.stock || 0) + Number(delta || 0))
	return product
}

module.exports = { list, setStock, adjustStock }
