const { getSupabase } = require('../config/db')

function mapCategory(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		createdAt: row.created_at,
	}
}

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('categories')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('name')
	if (error) throw error
	return (data || []).map(mapCategory)
}

async function create(tenantId, payload) {
	const { data, error } = await getSupabase()
		.from('categories')
		.insert({ tenant_id: tenantId, name: payload.name })
		.select()
		.single()
	if (error) throw error
	return mapCategory(data)
}

async function update(tenantId, categoryId, payload) {
	const { data, error } = await getSupabase()
		.from('categories')
		.update({ name: payload.name })
		.eq('id', categoryId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	return mapCategory(data)
}

async function remove(tenantId, categoryId) {
	const { error } = await getSupabase()
		.from('categories')
		.delete()
		.eq('id', categoryId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }