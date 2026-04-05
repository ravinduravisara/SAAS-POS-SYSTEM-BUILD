const express = require('express')
const { login, register } = require('../controllers/authController')
const auth = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', auth, async (req, res, next) => {
	try {
		const data = await require('../services/authService').me(req.user.userId, req.user.tenantId)
		res.json(data)
	} catch (err) {
		next(err)
	}
})

module.exports = router
