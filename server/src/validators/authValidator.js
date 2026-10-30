function loginValidator(req) {
	const { email, password } = req.body || {}
	if (!email || typeof email !== 'string' || !email.trim()) {
		return { error: 'Valid email is required' }
	}
	if (!password || typeof password !== 'string') {
		return { error: 'Password is required' }
	}
	return { ok: true }
}

module.exports = { loginValidator }
