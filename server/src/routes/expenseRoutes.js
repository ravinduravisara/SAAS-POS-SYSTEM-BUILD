const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const plan = require('../middlewares/planMiddleware')
const { listExpenses, createExpense } = require('../controllers/expenseController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', plan('expenseManagement'), listExpenses)
router.post('/', plan('expenseManagement'), createExpense)

module.exports = router
