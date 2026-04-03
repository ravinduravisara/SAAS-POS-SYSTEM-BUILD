const express = require('express')
const auth = require('../middlewares/authMiddleware')
const { listExpenses, createExpense } = require('../controllers/expenseController')

const router = express.Router()

router.get('/', auth, listExpenses)
router.post('/', auth, createExpense)

module.exports = router
