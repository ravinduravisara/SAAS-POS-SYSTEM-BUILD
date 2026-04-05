const saleService = require('../services/saleService')

async function listSales(req, res, next) {
	try {
		res.json(await saleService.list(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function createSale(req, res, next) {
	try {
		res.status(201).json(await saleService.create(req.user.tenantId, req.body || {}))
	} catch (err) {
		next(err)
	}
}

module.exports = { listSales, createSale }
