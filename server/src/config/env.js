const dotenv = require('dotenv')

dotenv.config()

const env = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 5000),
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}

module.exports = env
