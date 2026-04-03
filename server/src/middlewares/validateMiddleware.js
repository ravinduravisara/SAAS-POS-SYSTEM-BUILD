function validateMiddleware(validator) {
	return function (req, res, next) {
		try {
			if (typeof validator === 'function') {
				const result = validator(req)
				if (result && result.error) {
					return res.status(400).json({ message: result.error })
				}
			}
			return next()
		} catch (err) {
			return next(err)
		}
	}
}

module.exports = validateMiddleware
