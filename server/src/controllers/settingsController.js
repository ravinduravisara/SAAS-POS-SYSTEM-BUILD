const settingsService = require('../services/settingsService')

async function getSettings(req, res) {
	res.json(await settingsService.get(req.user.tenantId))
}

async function updateSettings(req, res) {
	res.json(await settingsService.update(req.user.tenantId, req.body || {}))
}

module.exports = { getSettings, updateSettings }
