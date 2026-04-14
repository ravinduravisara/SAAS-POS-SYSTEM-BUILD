function loginValidator(req) {
	const { email, password } = req.body || {}
	if (!email || !password) return { error: 'Email and password are required' }
	return { ok: true }
}

module.exports = { loginValidator }
