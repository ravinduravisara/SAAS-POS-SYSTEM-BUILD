const app = require('./app')
const env = require('./config/env')
const { connectDb } = require('./config/db')
const { seedInitialData } = require('./utils/seedAdmin')
const logger = require('./utils/logger')

async function start() {
	await connectDb()
	await seedInitialData()
	app.listen(env.port, () => {
		logger(`Server running on http://localhost:${env.port}`)
	})
}

start().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err)
	process.exit(1)
})
