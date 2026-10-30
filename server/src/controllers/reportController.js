const reportService = require('../services/reportService')

async function summary(req, res, next) {
	try {
		const data = await reportService.summary(req.user.tenantId, req.query)
		res.json(data)
	} catch (err) {
		next(err)
	}
}

async function exportCsv(req, res, next) {
	try {
		const csv = await reportService.exportCsv(req.user.tenantId, req.query)
		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', `attachment; filename="sales_report_${Date.now()}.csv"`)
		res.send(csv)
	} catch (err) {
		next(err)
	}
}

module.exports = { summary, exportCsv }
