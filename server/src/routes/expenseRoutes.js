const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const plan = require('../middlewares/planMiddleware')
const { listExpenses, createExpense, deleteExpense } = require('../controllers/expenseController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', plan('expenseManagement'), listExpenses)
router.post('/', plan('expenseManagement'), createExpense)
router.delete('/:id', plan('expenseManagement'), deleteExpense)

module.exports = router
