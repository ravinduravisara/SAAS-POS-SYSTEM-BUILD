const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === 'test' ? 10000 : 30, // 30 login attempts per 15 min
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
})

const apiLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: process.env.NODE_ENV === 'test' ? 100000 : 300, // 300 requests/min
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many requests. Please slow down.' },
})

module.exports = { authLimiter, apiLimiter }

