const { getSupabase } = require('../config/db')

function mapCustomer(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		phone: row.phone,
		email: row.email,
		createdAt: row.created_at,
	}
}

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('customers')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map(mapCustomer)
}

async function create(tenantId, payload) {
	const { data, error } = await getSupabase()
		.from('customers')
		.insert({
			tenant_id: tenantId,
			name: payload.name,
			phone: payload.phone || '',
			email: payload.email || '',
		})
		.select()
		.single()
	if (error) throw error
	return mapCustomer(data)
}

async function update(tenantId, customerId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = payload.name
	if (payload.phone !== undefined) updatePayload.phone = payload.phone
	if (payload.email !== undefined) updatePayload.email = payload.email
 
	const { data, error } = await getSupabase()
		.from('customers')
		.update(updatePayload)
		.eq('id', customerId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	return mapCustomer(data)
}

async function remove(tenantId, customerId) {
	const { error } = await getSupabase()
		.from('customers')
		.delete()
		.eq('id', customerId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }
