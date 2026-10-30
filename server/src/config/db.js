const { createClient } = require('@supabase/supabase-js')
const env = require('./env')
const { getInMemoryDb } = require('../db/inMemoryDb')

let supabase = null
let customClient = null

function setDatabaseProvider(client) {
	customClient = client
}

function getSupabase() {
	// Strictly prohibit mock database in production
	const isProd = process.env.NODE_ENV === 'production'
	if (isProd) {
		if (process.env.USE_MOCK_DB === 'true') {
			throw new Error('[SECURITY FATAL] USE_MOCK_DB cannot be enabled in production environment.')
		}
		const sbUrl = process.env.SUPABASE_URL || env.supabaseUrl
		const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.supabaseServiceRoleKey
		if (!sbUrl || !sbKey) {
			throw new Error('[FATAL] Missing required Supabase credentials in production. Persistent database is required.')
		}
	}

	if (customClient) {
		return customClient
	}

	if (!isProd && (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test')) {
		return getInMemoryDb()
	}

	if (!supabase) {
		if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
			if (isProd) {
				throw new Error('[FATAL] Production database credentials not configured.')
			}
			// Only allow local development fallback when explicitly non-production
			// eslint-disable-next-line no-console
			console.warn('[DEV NOTICE] Supabase credentials not found. Using local in-memory test store.')
			return getInMemoryDb()
		}

		supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
			auth: { persistSession: false },
		})
	}
	return supabase
}

async function connectDb() {
	const isProd = process.env.NODE_ENV === 'production'
	const db = getSupabase()

	if (!isProd && (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test' || customClient)) {
		// eslint-disable-next-line no-console
		console.log('Connected to In-Memory Transactional Database Provider (Test/Dev Mode)')
		return db
	}

	try {
		const { error } = await db.from('tenants').select('id').limit(1)
		if (error && error.code !== 'PGRST116') {
			throw new Error(`Database query test failed: ${error.message}`)
		}
		// eslint-disable-next-line no-console
		console.log('Connected to Supabase PostgreSQL')
		return db
	} catch (err) {
		if (isProd) {
			// In production, NEVER silently switch to in-memory temporary database!
			// eslint-disable-next-line no-console
			console.error(`[FATAL] Production database unreachable: ${err.message}`)
			throw new Error(`[FATAL] Production database unreachable: ${err.message}`)
		}

		// Development-only fallback
		// eslint-disable-next-line no-console
		console.warn(`[DEV WARNING] Live Supabase unreachable (${err.message}). Using In-Memory Database provider.`)
		customClient = getInMemoryDb()
		return customClient
	}
}

module.exports = { getSupabase, connectDb, setDatabaseProvider }
