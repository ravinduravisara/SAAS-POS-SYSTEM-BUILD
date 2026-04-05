const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { customerCreateValidator } = require('../validators/customerValidator')
const {
	listCustomers,
	createCustomer,
	updateCustomer,
	deleteCustomer,
} = require('../controllers/customerController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listCustomers)
router.post('/', validate(customerCreateValidator), createCustomer)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)

module.exports = router
