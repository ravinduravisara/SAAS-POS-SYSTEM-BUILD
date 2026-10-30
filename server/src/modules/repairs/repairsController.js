const repairsService = require('./repairsService')

async function listJobs(req, res, next) {
	try {
		res.json(await repairsService.listJobs(req.user.tenantId, req.query))
	} catch (err) {
		next(err)
	}
}

async function createJob(req, res, next) {
	try {
		res.status(201).json(await repairsService.createJob(req.user.tenantId, req.body || {}, req.user))
	} catch (err) {
		next(err)
	}
}

async function updateJobStatus(req, res, next) {
	try {
		const parts = req.body?.partsToConsume || req.body?.spareParts
		res.json(await repairsService.updateJobStatus(req.user.tenantId, req.params.id, req.body?.status, parts))
	} catch (err) {
		next(err)
	}
}

module.exports = { listJobs, createJob, updateJobStatus }
