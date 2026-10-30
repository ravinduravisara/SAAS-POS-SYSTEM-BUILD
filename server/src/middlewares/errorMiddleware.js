function errorMiddleware(err, req, res, next) {
	let status = err.status || err.statusCode || 500
	let message = err.message || 'Internal Server Error'
	let details = null

	// Zod validation errors
	if (err.name === 'ZodError') {
		status = 400
		message = 'Validation failed'
		details = err.errors?.map((e) => ({
			field: e.path.join('.'),
			message: e.message,
		}))
	}

	// Supabase / PostgreSQL errors
	if (err.code === '23505') {
		status = 409
		message = 'A record with these details already exists.'
	} else if (err.code === '23503') {
		status = 400
		message = 'Referenced entity does not exist or cannot be accessed.'
	}

	// Log unexpected server errors
	if (status >= 500 && process.env.NODE_ENV !== 'test') {
		// eslint-disable-next-line no-console
		console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err)
	}

	res.status(status).json({
		error: {
			status,
			message,
			...(details ? { details } : {}),
		},
		message, // For backwards compatibility with existing frontend error handlers
	})
}

module.exports = errorMiddleware
