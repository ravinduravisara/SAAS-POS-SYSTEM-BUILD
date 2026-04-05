const reportService = require('../services/reportService')

async function summary(req, res, next) {
	try {
		res.json(await reportService.summary(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

module.exports = { summary }
