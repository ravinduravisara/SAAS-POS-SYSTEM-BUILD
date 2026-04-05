const reportService = require('./reportService')
const { getSupabase } = require('../config/db')

async function stats(tenantId) {
	const db = getSupabase()
	const summary = await reportService.summary(tenantId)

	const { count: productsCount, error: productsError } = await db
		.from('products')
		.select('id', { count: 'exact', head: true })
		.eq('tenant_id', tenantId)
	if (productsError) throw productsError

	const { count: customersCount, error: customersError } = await db
		.from('customers')
		.select('id', { count: 'exact', head: true })
		.eq('tenant_id', tenantId)
	if (customersError) throw customersError

	const { data: lowStockRows, error: lowStockError } = await db
		.from('products')
		.select('id')
		.eq('tenant_id', tenantId)
		.lte('stock', 5)
	if (lowStockError) throw lowStockError

	return {
		...summary,
		lowStock: (lowStockRows || []).length,
		products: productsCount || 0,
		customers: customersCount || 0,
	}
}

module.exports = { stats }