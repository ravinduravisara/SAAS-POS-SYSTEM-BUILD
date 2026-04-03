function loginValidator(req) {
	const { email, password } = req.body || {}
	if (!email || !password) return { error: 'Email and password are required' }
	return { ok: true }
}

function registerValidator(req) {
	const { name, email, password } = req.body || {}
	if (!name || !email || !password) return { error: 'Name, email and password are required' }
	return { ok: true }
}

module.exports = { loginValidator, registerValidator }
