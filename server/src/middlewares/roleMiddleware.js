function roleMiddleware(allowedRoles = []) {
	return function (req, res, next) {
		const role = req.user?.role
		if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
			return res.status(403).json({ message: 'Forbidden' })
		}
		return next()
	}
}

module.exports = roleMiddleware
