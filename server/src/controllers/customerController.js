const customerService = require('../services/customerService')

async function listCustomers(req, res, next) {
	try {
		res.json(await customerService.list())
	} catch (err) {
		next(err)
	}
}

async function createCustomer(req, res, next) {
	try {
		res.status(201).json(await customerService.create(req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function updateCustomer(req, res, next) {
	try {
		res.json(await customerService.update(req.params.id, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function deleteCustomer(req, res, next) {
	try {
		const ok = await customerService.remove(req.params.id)
		res.json({ ok })
	} catch (err) {
		next(err)
	}
}

module.exports = { listCustomers, createCustomer, updateCustomer, deleteCustomer }
