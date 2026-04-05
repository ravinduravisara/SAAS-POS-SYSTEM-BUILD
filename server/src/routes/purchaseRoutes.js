const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { purchaseCreateValidator } = require('../validators/purchaseValidator')
const { listPurchases, createPurchase } = require('../controllers/purchaseController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listPurchases)
router.post('/', validate(purchaseCreateValidator), createPurchase)

module.exports = router
