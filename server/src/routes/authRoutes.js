const express = require('express')
const { login, me, changePassword, logout } = require('../controllers/authController')
const auth = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { loginValidator } = require('../validators/authValidator')

const router = express.Router()

router.post('/login', validate(loginValidator), login)
router.get('/me', auth, me)
router.post('/change-password', auth, changePassword)
router.post('/logout', auth, logout)

module.exports = router
