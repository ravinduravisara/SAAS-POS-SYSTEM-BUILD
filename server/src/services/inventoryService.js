const { getSupabase } = require('../config/db')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('products')
		.select('id, name, price, sku, barcode, stock, reorder_level, category_id')
		.eq('tenant_id', tenantId)
		.order('name')
	if (error) throw error
	return (data || []).map((product) => ({
		id: product.id,
		name: product.name,
		price: Number(product.price || 0),
		sku: product.sku || '',
		barcode: product.barcode || '',
		stock: Number(product.stock || 0),
		reorderLevel: Number(product.reorder_level || 5),
		categoryId: product.category_id,
	}))
}

async function setStock(tenantId, productId, stock) {
	const db = getSupabase()
	const nextStock = parseInt(stock, 10)
	if (Number.isNaN(nextStock) || nextStock < 0) {
		const err = new Error('Stock must be a non-negative integer')
		err.status = 400
		throw err
	}

	const { data: beforeRows, error: beforeError } = await db
		.from('products')
		.select('stock, name')
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.limit(1)
	if (beforeError) throw beforeError
	const before = beforeRows?.[0]
	if (!before) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}

	const delta = nextStock - Number(before.stock || 0)

	const { data, error } = await db
		.from('products')
		.update({ stock: nextStock })
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.select('id, name, price, sku, stock, category_id')
		.limit(1)
	if (error || !data || data.length === 0) {
		const err = new Error('Product update failed')
		err.status = 400
		throw err
	}

	await db.from('inventory_logs').insert({
		tenant_id: tenantId,
		product_id: productId,
		type: 'set',
		delta,
		note: `Manual stock reset to ${nextStock}`,
	})

	const product = data[0]
	return {
		id: product.id,
		name: product.name,
		price: Number(product.price || 0),
		sku: product.sku,
		stock: Number(product.stock || 0),
		categoryId: product.category_id,
	}
}

async function adjustStock(tenantId, productId, delta) {
	const db = getSupabase()
	const deltaInt = parseInt(delta, 10)
	if (Number.isNaN(deltaInt)) {
		const err = new Error('Delta must be an integer')
		err.status = 400
		throw err
	}

	const { data: productRows, error: productError } = await db
		.from('products')
		.select('id, stock, name')
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.limit(1)
	if (productError) throw productError
	if (!productRows || productRows.length === 0) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}

	const product = productRows[0]
	const newStock = Number(product.stock || 0) + deltaInt
	if (newStock < 0) {
		const err = new Error(`Cannot adjust stock below 0. Current: ${product.stock}, Adjustment: ${deltaInt}`)
		err.status = 400
		throw err
	}

	const { data, error } = await db
		.from('products')
		.update({ stock: newStock })
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.select('id, name, price, sku, stock, category_id')
		.limit(1)
	if (error) throw error

	await db.from('inventory_logs').insert({
		tenant_id: tenantId,
		product_id: productId,
		type: 'adjust',
		delta: deltaInt,
		note: deltaInt > 0 ? `Stock addition (+${deltaInt})` : `Stock reduction (${deltaInt})`,
	})

	const updated = data[0]
	return {
		id: updated.id,
		name: updated.name,
		price: Number(updated.price || 0),
		sku: updated.sku,
		stock: Number(updated.stock || 0),
		categoryId: updated.category_id,
	}
}

module.exports = { list, setStock, adjustStock }
