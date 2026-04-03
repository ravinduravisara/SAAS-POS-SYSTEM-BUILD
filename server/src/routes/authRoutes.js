const express = require('express')
const { login, register } = require('../controllers/authController')
const validate = require('../middlewares/validateMiddleware')
const { loginValidator, registerValidator } = require('../validators/authValidator')

const router = express.Router()

router.post('/login', validate(loginValidator), login)
router.post('/register', validate(registerValidator), register)

module.exports = router
