const supplierService = require('../services/supplierService')

async function listSuppliers(req, res, next) {
	try {
		res.json(await supplierService.list(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function createSupplier(req, res, next) {
	try {
		res.status(201).json(await supplierService.create(req.user.tenantId, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function updateSupplier(req, res, next) {
	try {
		res.json(await supplierService.update(req.user.tenantId, req.params.id, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function deleteSupplier(req, res, next) {
	try {
		res.json({ ok: await supplierService.remove(req.user.tenantId, req.params.id) })
	} catch (err) {
		next(err)
	}
}

module.exports = { listSuppliers, createSupplier, updateSupplier, deleteSupplier }

