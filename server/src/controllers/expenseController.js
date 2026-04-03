const { store, id } = require('../data/store')

async function listExpenses(req, res) {
	res.json(store.expenses)
}

async function createExpense(req, res) {
	const payload = req.body || {}
	const expense = {
		id: id('ex'),
		createdAt: new Date().toISOString(),
		title: payload.title,
		amount: Number(payload.amount || 0),
		notes: payload.notes || '',
	}
	store.expenses.unshift(expense)
	res.status(201).json(expense)
}

module.exports = { listExpenses, createExpense }
