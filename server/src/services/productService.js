const { store, id } = require('../data/store')

async function list() {
	return store.products
}

async function create(payload) {
	const product = {
		id: id('p'),
		name: payload.name,
		price: Number(payload.price || 0),
		sku: payload.sku || '',
		stock: Number(payload.stock || 0),
		categoryId: payload.categoryId || null,
	}
	store.products.push(product)
	return product
}

async function update(productId, payload) {
	const product = store.products.find((p) => p.id === productId)
	if (!product) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}
	if (payload.name !== undefined) product.name = payload.name
	if (payload.price !== undefined) product.price = Number(payload.price || 0)
	if (payload.sku !== undefined) product.sku = payload.sku
	if (payload.stock !== undefined) product.stock = Number(payload.stock || 0)
	if (payload.categoryId !== undefined) product.categoryId = payload.categoryId
	return product
}

async function remove(productId) {
	const before = store.products.length
	store.products = store.products.filter((p) => p.id !== productId)
	return store.products.length !== before
}

module.exports = { list, create, update, remove }
