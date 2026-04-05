const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const {
	listUsers,
	createUser,
	updateUser,
	deleteUser,
} = require('../controllers/userController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listUsers)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

module.exports = router
