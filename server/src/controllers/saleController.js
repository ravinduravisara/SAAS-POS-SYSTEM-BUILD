const saleService = require('../services/saleService')

async function listSales(req, res, next) {
	try {
		res.json(await saleService.list(req.user.tenantId, req.query))
	} catch (err) {
		next(err)
	}
}

async function getSale(req, res, next) {
	try {
		res.json(await saleService.getById(req.user.tenantId, req.params.id))
	} catch (err) {
		next(err)
	}
}

async function createSale(req, res, next) {
	try {
		// Pass authenticated user context for cashier assignment
		const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey
		const payload = { ...req.body, idempotencyKey }
		res.status(201).json(await saleService.create(req.user.tenantId, payload, req.user))
	} catch (err) {
		next(err)
	}
}

async function refundSale(req, res, next) {
	try {
		res.json(await saleService.refund(req.user.tenantId, req.params.id, req.body || {}, req.user))
	} catch (err) {
		next(err)
	}
}

module.exports = { listSales, getSale, createSale, refundSale }
