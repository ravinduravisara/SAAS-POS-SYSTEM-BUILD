const expenseService = require('../services/expenseService')

async function listExpenses(req, res, next) {
	try {
		res.json(await expenseService.list(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function createExpense(req, res, next) {
	try {
		res.status(201).json(await expenseService.create(req.user.tenantId, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function deleteExpense(req, res, next) {
	try {
		res.json({ ok: await expenseService.remove(req.user.tenantId, req.params.id) })
	} catch (err) {
		next(err)
	}
}

module.exports = { listExpenses, createExpense, deleteExpense }
