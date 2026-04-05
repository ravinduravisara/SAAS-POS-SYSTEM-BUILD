const { getSupabase } = require('../config/db')

function mapProduct(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		sku: row.sku,
		price: Number(row.price || 0),
		stock: Number(row.stock || 0),
		categoryId: row.category_id,
		createdAt: row.created_at,
	}
}

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('products')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map(mapProduct)
}

async function create(tenantId, payload) {
	const { data, error } = await getSupabase()
		.from('products')
		.insert({
			tenant_id: tenantId,
			name: payload.name,
			sku: payload.sku || '',
			price: Number(payload.price || 0),
			stock: Number(payload.stock || 0),
			category_id: payload.categoryId || null,
		})
		.select()
		.single()
	if (error) throw error
	return mapProduct(data)
}

async function update(tenantId, productId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = payload.name
	if (payload.price !== undefined) updatePayload.price = Number(payload.price)
	if (payload.sku !== undefined) updatePayload.sku = payload.sku
	if (payload.stock !== undefined) updatePayload.stock = Number(payload.stock)
	if (payload.categoryId !== undefined) updatePayload.category_id = payload.categoryId

	const { data, error } = await getSupabase()
		.from('products')
		.update(updatePayload)
		.eq('id', productId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	if (!data) {
		const err = new Error('Product not found')
		err.status = 404
		throw err
	}
	return mapProduct(data)
}

async function remove(tenantId, productId) {
	const { error } = await getSupabase()
		.from('products')
		.delete()
		.eq('id', productId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }
