const express = require('express')
const { login } = require('../controllers/authController')
const auth = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { loginValidator } = require('../validators/authValidator')

const router = express.Router()

router.post('/login', validate(loginValidator), login)
router.get('/me', auth, async (req, res, next) => {
	try {
		const data = await require('../services/authService').me(req.user.userId, req.user.tenantId)
		res.json(data)
	} catch (err) {
		next(err)
	}
})

module.exports = router
