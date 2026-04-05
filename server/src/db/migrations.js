const { getSupabase } = require('../config/db')

async function checkTables() {
	const db = getSupabase()
	const tables = ['tenants', 'users', 'products', 'categories', 'sales', 'sale_items', 'customers', 'subscriptions']
	const results = {}
	for (const table of tables) {
		const { error } = await db.from(table).select('id').limit(1)
		results[table] = error ? `ERROR: ${error.message}` : 'OK'
	}
	// eslint-disable-next-line no-console
	console.table(results)
}

module.exports = { checkTables }
