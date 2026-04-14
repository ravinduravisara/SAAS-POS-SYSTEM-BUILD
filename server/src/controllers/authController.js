const authService = require('../services/authService')

async function login(req, res, next) {
	try {
		const { email, password } = req.body || {}
		const data = await authService.login({ email, password })
		res.json(data)
	} catch (err) {
		next(err)
	}
}

module.exports = { login }
