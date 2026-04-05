const userService = require('../services/userService')

async function listUsers(req, res) {
	res.json(await userService.list(req.user.tenantId))
}

async function createUser(req, res) {
	res.status(201).json(await userService.create(req.user.tenantId, req.body || {}))
}

async function updateUser(req, res) {
	res.json(await userService.update(req.user.tenantId, req.params.id, req.body || {}))
}

async function deleteUser(req, res) {
	res.json({ ok: await userService.remove(req.user.tenantId, req.params.id) })
}

module.exports = { listUsers, createUser, updateUser, deleteUser }
