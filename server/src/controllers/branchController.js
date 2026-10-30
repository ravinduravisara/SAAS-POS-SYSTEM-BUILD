const branchService = require('../services/branchService')

async function listBranches(req, res, next) {
	try {
		res.json(await branchService.list(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function createBranch(req, res, next) {
	try {
		res.status(201).json(await branchService.create(req.user.tenantId, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function updateBranch(req, res, next) {
	try {
		res.json(await branchService.update(req.user.tenantId, req.params.id, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function deleteBranch(req, res, next) {
	try {
		res.json({ ok: await branchService.remove(req.user.tenantId, req.params.id) })
	} catch (err) {
		next(err)
	}
}

module.exports = { listBranches, createBranch, updateBranch, deleteBranch }

