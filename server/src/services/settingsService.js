const { getSupabase } = require('../config/db')

async function get(tenantId) {
	const { data, error } = await getSupabase()
		.from('tenant_settings')
		.select('*')
		.eq('tenant_id', tenantId)
		.single()
	if (error && error.code !== 'PGRST116') throw error

	if (!data) {
		return { currency: 'LKR', taxRate: 0 }
	}

	return {
		currency: data.currency,
		taxRate: Number(data.tax_rate || 0),
		storeName: data.store_name,
		timezone: data.timezone,
	}
}

async function update(tenantId, payload) {
	const db = getSupabase()
	const updatePayload = {}
	if (payload.currency !== undefined) updatePayload.currency = payload.currency
	if (payload.taxRate !== undefined) updatePayload.tax_rate = Number(payload.taxRate)
	if (payload.storeName !== undefined) updatePayload.store_name = payload.storeName
	if (payload.timezone !== undefined) updatePayload.timezone = payload.timezone

	const { data, error } = await db
		.from('tenant_settings')
		.upsert({ tenant_id: tenantId, ...updatePayload }, { onConflict: 'tenant_id' })
		.select()
		.single()
	if (error) throw error

	return {
		currency: data.currency,
		taxRate: Number(data.tax_rate || 0),
		storeName: data.store_name,
		timezone: data.timezone,
	}
}

module.exports = { get, update }