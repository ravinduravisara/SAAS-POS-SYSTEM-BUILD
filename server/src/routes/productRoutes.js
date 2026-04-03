const express = require('express')
const auth = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { productCreateValidator } = require('../validators/productValidator')
const {
	listProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('../controllers/productController')

const router = express.Router()

router.get('/', auth, listProducts)
router.post('/', auth, validate(productCreateValidator), createProduct)
router.put('/:id', auth, updateProduct)
router.delete('/:id', auth, deleteProduct)

module.exports = router
