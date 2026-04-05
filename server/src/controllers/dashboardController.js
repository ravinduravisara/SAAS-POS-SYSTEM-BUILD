const dashboardService = require('../services/dashboardService')

async function stats(req, res, next) {
	try {
		res.json(await dashboardService.stats(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

module.exports = { stats }
