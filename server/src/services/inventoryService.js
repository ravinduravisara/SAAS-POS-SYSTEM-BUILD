const { getSupabase } = require('../config/db')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('products')
		.select('id, name, price, sku, stock, category_id')
		.eq('tenant_id', tenantId)
		.order('name')
	if (error) throw error
	return (data || []).map((product) => ({
		id: product.id,
		name: product.name,
		price: Number(product.price || 0),
		sku: product.sku,
		stock: Number(product.stock || 0),
		categoryId: product.category_id,
	}))
}

async function setStock(tenantId, productId, stock) {
	const db = getSupabase()
	const nextStock = Number(stock)
	if (!Number.isFinite(nextStock) || nextStock < 0) {
		const err = new Error('Invalid stock value')
		err.status = 400
		throw err
	}

	const { data: beforeRows, error: beforeError } = await db
		.from('products')
		.select('stock')
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.limit(1)
	if (beforeError) throw beforeError
	const before = beforeRows?.[0]

	const { data, error } = await db
		.from('products')
		.update({ stock: nextStock })
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.select('id, name, price, sku, stock, category_id')
		.limit(1)
	if (error || !data || data.length === 0) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}

	const { error: logError } = await db
		.from('inventory_logs')
		.insert({ tenant_id: tenantId, product_id: productId, type: 'set', delta: nextStock - Number(before?.stock || 0), note: 'Manual stock set' })
	if (logError) throw logError

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
	const { data: productRows, error: productError } = await db
		.from('products')
		.select('id, stock')
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
	const newStock = Math.max(0, Number(product.stock || 0) + Number(delta || 0))
	const { data, error } = await db
		.from('products')
		.update({ stock: newStock })
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.select('id, name, price, sku, stock, category_id')
		.limit(1)
	if (error) throw error

	const { error: logError } = await db
		.from('inventory_logs')
		.insert({ tenant_id: tenantId, product_id: productId, type: 'adjust', delta: Number(delta || 0), note: 'Manual adjustment' })
	if (logError) throw logError

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
