const { getSupabase } = require('../config/db')

function mapCustomer(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		phone: row.phone || '',
		email: row.email || '',
		address: row.address || '',
		taxNumber: row.tax_number || '',
		creditLimit: Number(row.credit_limit || 0),
		outstandingBalance: Number(row.outstanding_balance || 0),
		notes: row.notes || '',
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
	const name = String(payload.name || '').trim()
	if (!name) {
		const err = new Error('Customer name is required')
		err.status = 400
		throw err
	}

	const { data, error } = await getSupabase()
		.from('customers')
		.insert({
			tenant_id: tenantId,
			name,
			phone: payload.phone || '',
			email: payload.email || '',
			address: payload.address || '',
			tax_number: payload.taxNumber || '',
			credit_limit: Number(payload.creditLimit || 0),
			outstanding_balance: 0,
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error
	return mapCustomer(data)
}

async function update(tenantId, customerId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = String(payload.name).trim()
	if (payload.phone !== undefined) updatePayload.phone = payload.phone
	if (payload.email !== undefined) updatePayload.email = payload.email
	if (payload.address !== undefined) updatePayload.address = payload.address
	if (payload.taxNumber !== undefined) updatePayload.tax_number = payload.taxNumber
	if (payload.creditLimit !== undefined) updatePayload.credit_limit = Number(payload.creditLimit || 0)
	if (payload.notes !== undefined) updatePayload.notes = payload.notes

	const { data, error } = await getSupabase()
		.from('customers')
		.update(updatePayload)
		.eq('id', customerId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	if (!data) {
		const err = new Error('Customer not found')
		err.status = 404
		throw err
	}
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
