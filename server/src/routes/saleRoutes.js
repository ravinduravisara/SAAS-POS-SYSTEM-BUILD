const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { saleCreateValidator } = require('../validators/saleValidator')
const {
	listSales,
	getSale,
	createSale,
	refundSale,
} = require('../controllers/saleController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listSales)
router.get('/:id', getSale)
router.post('/', validate(saleCreateValidator), createSale)
router.post('/:id/refund', refundSale)

module.exports = router
