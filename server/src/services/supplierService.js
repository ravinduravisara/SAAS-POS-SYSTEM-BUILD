const { getSupabase } = require('../config/db')

function mapSupplier(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		contactName: row.contact_name || '',
		email: row.email || '',
		phone: row.phone || '',
		address: row.address || '',
		taxNumber: row.tax_number || '',
		paymentTerms: row.payment_terms || 'net30',
		notes: row.notes || '',
		createdAt: row.created_at,
	}
}

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('suppliers')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('name')
	if (error) throw error
	return (data || []).map(mapSupplier)
}

async function create(tenantId, payload) {
	const name = String(payload.name || '').trim()
	if (!name) {
		const err = new Error('Supplier name is required')
		err.status = 400
		throw err
	}

	const { data, error } = await getSupabase()
		.from('suppliers')
		.insert({
			tenant_id: tenantId,
			name,
			contact_name: payload.contactName || '',
			email: payload.email || '',
			phone: payload.phone || '',
			address: payload.address || '',
			tax_number: payload.taxNumber || '',
			payment_terms: payload.paymentTerms || 'net30',
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error
	return mapSupplier(data)
}

async function update(tenantId, supplierId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = String(payload.name).trim()
	if (payload.contactName !== undefined) updatePayload.contact_name = payload.contactName
	if (payload.email !== undefined) updatePayload.email = payload.email
	if (payload.phone !== undefined) updatePayload.phone = payload.phone
	if (payload.address !== undefined) updatePayload.address = payload.address
	if (payload.taxNumber !== undefined) updatePayload.tax_number = payload.taxNumber
	if (payload.paymentTerms !== undefined) updatePayload.payment_terms = payload.paymentTerms
	if (payload.notes !== undefined) updatePayload.notes = payload.notes

	const { data, error } = await getSupabase()
		.from('suppliers')
		.update(updatePayload)
		.eq('id', supplierId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	if (!data) {
		const err = new Error('Supplier not found')
		err.status = 404
		throw err
	}
	return mapSupplier(data)
}

async function remove(tenantId, supplierId) {
	const { error } = await getSupabase()
		.from('suppliers')
		.delete()
		.eq('id', supplierId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }

