const express = require('express')
const auth = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { purchaseCreateValidator } = require('../validators/purchaseValidator')
const { listPurchases, createPurchase } = require('../controllers/purchaseController')

const router = express.Router()

router.get('/', auth, listPurchases)
router.post('/', auth, validate(purchaseCreateValidator), createPurchase)

module.exports = router
