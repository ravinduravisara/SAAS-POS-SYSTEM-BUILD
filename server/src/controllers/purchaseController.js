const purchaseService = require('../services/purchaseService')

async function listPurchases(req, res, next) {
	try {
		res.json(await purchaseService.list())
	} catch (err) {
		next(err)
	}
}

async function createPurchase(req, res, next) {
	try {
		res.status(201).json(await purchaseService.create(req.body || {}))
	} catch (err) {
		next(err)
	}
}

module.exports = { listPurchases, createPurchase }
