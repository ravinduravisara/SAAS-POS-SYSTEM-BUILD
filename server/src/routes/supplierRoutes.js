const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const plan = require('../middlewares/planMiddleware')
const {
	listSuppliers,
	createSupplier,
	updateSupplier,
	deleteSupplier,
} = require('../controllers/supplierController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', plan('purchaseManagement'), listSuppliers)
router.post('/', plan('purchaseManagement'), createSupplier)
router.put('/:id', plan('purchaseManagement'), updateSupplier)
router.delete('/:id', plan('purchaseManagement'), deleteSupplier)

module.exports = router

