const { createClient } = require('@supabase/supabase-js')
const env = require('./env')

let supabase = null

function getSupabase() {
	if (!supabase) {
		supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
			auth: { persistSession: false },
		})
	}
	return supabase
}

async function connectDb() {
	const db = getSupabase()
	const { error } = await db.from('tenants').select('id').limit(1)
	if (error && error.code !== 'PGRST116') {
		throw new Error(`Supabase connection failed: ${error.message}`)
	}
	// eslint-disable-next-line no-console
	console.log('Connected to Supabase PostgreSQL')
	return db
}

module.exports = { getSupabase, connectDb }
