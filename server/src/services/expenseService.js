const { getSupabase } = require('../config/db')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('expenses')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map((expense) => ({
		id: expense.id,
		tenantId: expense.tenant_id,
		title: expense.title,
		amount: Number(expense.amount || 0),
		notes: expense.notes || '',
		createdAt: expense.created_at,
	}))
}

async function create(tenantId, payload) {
	const { data, error } = await getSupabase()
		.from('expenses')
		.insert({
			tenant_id: tenantId,
			title: payload.title,
			amount: Number(payload.amount || 0),
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error
	return {
		id: data.id,
		tenantId: data.tenant_id,
		title: data.title,
		amount: Number(data.amount || 0),
		notes: data.notes || '',
		createdAt: data.created_at,
	}
}

module.exports = { list, create }