const { getSupabase } = require('../config/db')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('users')
		.select('id, tenant_id, name, email, role, created_at')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map((user) => ({
		id: user.id,
		tenantId: user.tenant_id,
		name: user.name,
		email: user.email,
		role: user.role,
		createdAt: user.created_at,
	}))
}

async function create(tenantId, payload) {
	const { data, error } = await getSupabase()
		.from('users')
		.insert({
			tenant_id: tenantId,
			name: payload.name,
			email: String(payload.email || '').toLowerCase(),
			role: payload.role || 'cashier',
			password: payload.password || 'password',
		})
		.select()
		.single()
	if (error) throw error
	return {
		id: data.id,
		tenantId: data.tenant_id,
		name: data.name,
		email: data.email,
		role: data.role,
	}
}

async function update(tenantId, userId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = payload.name
	if (payload.email !== undefined) updatePayload.email = String(payload.email || '').toLowerCase()
	if (payload.role !== undefined) updatePayload.role = payload.role

	const { data, error } = await getSupabase()
		.from('users')
		.update(updatePayload)
		.eq('id', userId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	if (!data) {
		const err = new Error('User not found')
		err.status = 404
		throw err
	}
	return {
		id: data.id,
		tenantId: data.tenant_id,
		name: data.name,
		email: data.email,
		role: data.role,
	}
}

async function remove(tenantId, userId) {
	const { error } = await getSupabase()
		.from('users')
		.delete()
		.eq('id', userId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }