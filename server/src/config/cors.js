const cors = require('cors')
const env = require('./env')

function corsMiddleware() {
	return cors({
		origin: env.corsOrigin,
		credentials: true,
	})
}

module.exports = corsMiddleware
