const saleService = require('../services/saleService')

async function listSales(req, res, next) {
	try {
		res.json(await saleService.list())
	} catch (err) {
		next(err)
	}
}

async function createSale(req, res, next) {
	try {
		res.status(201).json(await saleService.create(req.body || {}))
	} catch (err) {
		next(err)
	}
}

module.exports = { listSales, createSale }
