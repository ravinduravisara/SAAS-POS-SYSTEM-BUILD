const authService = require('../services/authService')

async function login(req, res, next) {
	try {
		const { email, password, tenantId } = req.body || {}
		const ip = req.ip || req.headers['x-forwarded-for'] || null
		const data = await authService.login({ email, password, tenantId, ip })
		res.json(data)
	} catch (err) {
		next(err)
	}
}

async function me(req, res, next) {
	try {
		const data = await authService.me(req.user.userId, req.user.tenantId)
		res.json(data)
	} catch (err) {
		next(err)
	}
}

async function changePassword(req, res, next) {
	try {
		const { oldPassword, newPassword } = req.body || {}
		const result = await authService.changePassword({
			userId: req.user.userId,
			tenantId: req.user.tenantId,
			oldPassword,
			newPassword,
		})
		res.json(result)
	} catch (err) {
		next(err)
	}
}

async function logout(req, res) {
	// Stateless JWT logout acknowledgment (or token blacklist / session revocation)
	res.json({ ok: true, message: 'Logged out successfully' })
}

module.exports = { login, me, changePassword, logout }
