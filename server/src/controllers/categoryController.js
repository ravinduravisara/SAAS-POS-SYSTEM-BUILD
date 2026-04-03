const { store, id } = require('../data/store')

async function listCategories(req, res) {
	res.json(store.categories)
}

async function createCategory(req, res) {
	const { name } = req.body || {}
	const category = { id: id('c'), name }
	store.categories.push(category)
	res.status(201).json(category)
}

async function updateCategory(req, res) {
	const category = store.categories.find((c) => c.id === req.params.id)
	if (!category) return res.status(404).json({ message: 'Category not found' })
	category.name = req.body?.name ?? category.name
	res.json(category)
}

async function deleteCategory(req, res) {
	const before = store.categories.length
	store.categories = store.categories.filter((c) => c.id !== req.params.id)
	res.json({ ok: store.categories.length !== before })
}

module.exports = {
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory,
}
