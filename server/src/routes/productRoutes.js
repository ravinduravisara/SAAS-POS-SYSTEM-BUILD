const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { productCreateValidator } = require('../validators/productValidator')
const {
	listProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('../controllers/productController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listProducts)
router.post('/', validate(productCreateValidator), createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

module.exports = router
