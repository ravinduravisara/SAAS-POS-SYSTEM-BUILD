const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const plan = require('../middlewares/planMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { purchaseCreateValidator } = require('../validators/purchaseValidator')
const { listPurchases, createPurchase } = require('../controllers/purchaseController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', plan('purchaseManagement'), listPurchases)
router.post('/', plan('purchaseManagement'), validate(purchaseCreateValidator), createPurchase)

module.exports = router
