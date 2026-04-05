const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const { listExpenses, createExpense } = require('../controllers/expenseController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listExpenses)
router.post('/', createExpense)

module.exports = router
