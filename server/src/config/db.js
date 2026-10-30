const { createClient } = require('@supabase/supabase-js')
const env = require('./env')
const { getInMemoryDb } = require('../db/inMemoryDb')

let supabase = null
let customClient = null

function setDatabaseProvider(client) {
	customClient = client
}

function getSupabase() {
	if (customClient) {
		return customClient
	}

	if (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test') {
		return getInMemoryDb()
	}

	if (!supabase) {
		if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
			// Fallback to in-memory store in local dev if credentials are not configured
			// eslint-disable-next-line no-console
			console.warn('NOTICE: Supabase credentials not found, using in-memory transactional database provider.')
			return getInMemoryDb()
		}

		supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
			auth: { persistSession: false },
		})
	}
	return supabase
}

async function connectDb() {
	const db = getSupabase()
	if (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test' || customClient) {
		// eslint-disable-next-line no-console
		console.log('Connected to In-Memory Transactional Database Provider')
		return db
	}

	try {
		const { error } = await db.from('tenants').select('id').limit(1)
		if (error && error.code !== 'PGRST116') {
			throw new Error(`Supabase connection failed: ${error.message}`)
		}
		// eslint-disable-next-line no-console
		console.log('Connected to Supabase PostgreSQL')
		return db
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn(`NOTICE: Live Supabase unreachable (${err.message}). Using In-Memory Database provider.`)
		customClient = getInMemoryDb()
		return customClient
	}
}

module.exports = { getSupabase, connectDb, setDatabaseProvider }
