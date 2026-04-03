const express = require('express')
const auth = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { customerCreateValidator } = require('../validators/customerValidator')
const {
	listCustomers,
	createCustomer,
	updateCustomer,
	deleteCustomer,
} = require('../controllers/customerController')

const router = express.Router()

router.get('/', auth, listCustomers)
router.post('/', auth, validate(customerCreateValidator), createCustomer)
router.put('/:id', auth, updateCustomer)
router.delete('/:id', auth, deleteCustomer)

module.exports = router
