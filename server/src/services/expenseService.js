const { getSupabase } = require('../config/db')
const { round } = require('../../../shared/utils/decimal')

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
		category: expense.category || 'General',
		amount: Number(expense.amount || 0),
		paymentMethod: expense.payment_method || 'cash',
		notes: expense.notes || '',
		createdAt: expense.created_at,
	}))
}

async function create(tenantId, payload) {
	const title = String(payload.title || '').trim()
	if (!title) {
		const err = new Error('Expense title is required')
		err.status = 400
		throw err
	}

	const amount = Number(payload.amount)
	if (Number.isNaN(amount) || amount <= 0) {
		const err = new Error('Valid positive amount is required')
		err.status = 400
		throw err
	}

	const { data, error } = await getSupabase()
		.from('expenses')
		.insert({
			tenant_id: tenantId,
			title,
			category: payload.category || 'General',
			amount: round(amount, 2),
			payment_method: payload.paymentMethod || 'cash',
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: data.id,
		tenantId: data.tenant_id,
		title: data.title,
		category: data.category,
		amount: Number(data.amount || 0),
		paymentMethod: data.payment_method,
		notes: data.notes || '',
		createdAt: data.created_at,
	}
}

async function remove(tenantId, expenseId) {
	const { error } = await getSupabase()
		.from('expenses')
		.delete()
		.eq('id', expenseId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, remove }
