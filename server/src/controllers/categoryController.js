const categoryService = require('../services/categoryService')

async function listCategories(req, res) {
	res.json(await categoryService.list(req.user.tenantId))
}

async function createCategory(req, res) {
	res.status(201).json(await categoryService.create(req.user.tenantId, req.body || {}))
}

async function updateCategory(req, res) {
	res.json(await categoryService.update(req.user.tenantId, req.params.id, req.body || {}))
}

async function deleteCategory(req, res) {
	res.json({ ok: await categoryService.remove(req.user.tenantId, req.params.id) })
}

module.exports = {
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory,
}
