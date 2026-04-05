const expenseService = require('../services/expenseService')

async function listExpenses(req, res) {
	res.json(await expenseService.list(req.user.tenantId))
}

async function createExpense(req, res) {
	res.status(201).json(await expenseService.create(req.user.tenantId, req.body || {}))
}

module.exports = { listExpenses, createExpense }
