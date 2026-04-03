function authMiddleware(req, res, next) {
	const header = req.headers.authorization || ''
	const token = header.startsWith('Bearer ') ? header.slice(7) : null

	if (!token) {
		return res.status(401).json({ message: 'Unauthorized' })
	}

	// Demo only: attach a mock user
	req.user = { id: 'demo', role: 'admin' }
	return next()
}

module.exports = authMiddleware
