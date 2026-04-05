function loginValidator(req) {
	const { email, password } = req.body || {}
	if (!email || !password) return { error: 'Email and password are required' }
	return { ok: true }
}

function registerValidator(req) {
	const { name, email, password, storeName } = req.body || {}
	if (!name || !email || !password || !storeName) {
		return { error: 'Name, email, password and store name are required' }
	}
	return { ok: true }
}

module.exports = { loginValidator, registerValidator }
