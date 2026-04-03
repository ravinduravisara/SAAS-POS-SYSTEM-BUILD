const express = require('express')
const auth = require('../middlewares/authMiddleware')
const {
	listUsers,
	createUser,
	updateUser,
	deleteUser,
} = require('../controllers/userController')

const router = express.Router()

router.get('/', auth, listUsers)
router.post('/', auth, createUser)
router.put('/:id', auth, updateUser)
router.delete('/:id', auth, deleteUser)

module.exports = router
