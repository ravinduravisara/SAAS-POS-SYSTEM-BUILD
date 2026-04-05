const dotenv = require('dotenv')

dotenv.config()

const env = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 5001),
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	supabaseUrl: process.env.SUPABASE_URL,
	supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
}

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
	// eslint-disable-next-line no-console
	console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. DB calls will fail.')
}

module.exports = env
