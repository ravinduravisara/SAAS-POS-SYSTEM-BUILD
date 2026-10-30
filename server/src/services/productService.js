const { getSupabase } = require('../config/db')
const { PLAN_FEATURES } = require('../../../shared/constants/plans')

function mapProduct(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		sku: row.sku || '',
		barcode: row.barcode || '',
		description: row.description || '',
		price: Number(row.price || 0),
		costPrice: Number(row.cost_price || 0),
		wholesalePrice: Number(row.wholesale_price || row.price || 0),
		stock: Number(row.stock || 0),
		reorderLevel: Number(row.reorder_level || 5),
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
	const db = getSupabase()

	// Enforce Subscription Plan Product Limits
	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('plan, feature_overrides')
		.eq('id', tenantId)
		.single()
	if (tenantError) throw tenantError

	const planConfig = PLAN_FEATURES[tenant.plan] || PLAN_FEATURES.starter
	const maxProducts = tenant.feature_overrides?.maxProducts !== undefined
		? tenant.feature_overrides.maxProducts
		: planConfig.maxProducts

	if (maxProducts !== -1) {
		const { count, error: countError } = await db
			.from('products')
			.select('id', { count: 'exact', head: true })
			.eq('tenant_id', tenantId)
		if (countError) throw countError

		if ((count || 0) >= maxProducts) {
			const err = new Error(`Product limit reached (${maxProducts} maximum) for your current subscription plan. Please upgrade to add more products.`)
			err.status = 403
			throw err
		}
	}

	const name = String(payload.name || '').trim()
	if (!name) {
		const err = new Error('Product name is required')
		err.status = 400
		throw err
	}

	const price = Number(payload.price)
	if (Number.isNaN(price) || price < 0) {
		const err = new Error('Valid non-negative price is required')
		err.status = 400
		throw err
	}

	const { data, error } = await db
		.from('products')
		.insert({
			tenant_id: tenantId,
			name,
			sku: payload.sku || '',
			barcode: payload.barcode || payload.sku || '',
			description: payload.description || '',
			price,
			cost_price: Number(payload.costPrice || 0),
			wholesale_price: Number(payload.wholesalePrice || price),
			stock: Math.max(0, parseInt(payload.stock, 10) || 0),
			reorder_level: Math.max(0, parseInt(payload.reorderLevel, 10) || 5),
			category_id: payload.categoryId || null,
		})
		.select()
		.single()
	if (error) throw error
	return mapProduct(data)
}

async function update(tenantId, productId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = String(payload.name).trim()
	if (payload.price !== undefined) {
		const price = Number(payload.price)
		if (Number.isNaN(price) || price < 0) {
			const err = new Error('Valid non-negative price is required')
			err.status = 400
			throw err
		}
		updatePayload.price = price
	}
	if (payload.costPrice !== undefined) updatePayload.cost_price = Number(payload.costPrice || 0)
	if (payload.wholesalePrice !== undefined) updatePayload.wholesale_price = Number(payload.wholesalePrice || 0)
	if (payload.sku !== undefined) updatePayload.sku = payload.sku
	if (payload.barcode !== undefined) updatePayload.barcode = payload.barcode
	if (payload.description !== undefined) updatePayload.description = payload.description
	if (payload.stock !== undefined) updatePayload.stock = Math.max(0, parseInt(payload.stock, 10) || 0)
	if (payload.reorderLevel !== undefined) updatePayload.reorder_level = Math.max(0, parseInt(payload.reorderLevel, 10) || 0)
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
