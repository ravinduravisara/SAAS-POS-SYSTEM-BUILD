const crypto = require('crypto')

const ITERATIONS = 100000
const KEYLEN = 64
const DIGEST = 'sha512'
const PREFIX = 'pbkdf2'

function hashPassword(plainText) {
	const salt = crypto.randomBytes(16).toString('hex')
	const hash = crypto.pbkdf2Sync(String(plainText || ''), salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
	return `${PREFIX}$${ITERATIONS}$${salt}$${hash}`
}

function isHashedPassword(value) {
	return typeof value === 'string' && value.startsWith(`${PREFIX}$`)
}

function verifyPassword(plainText, storedHash) {
	if (!storedHash) return false
	if (!isHashedPassword(storedHash)) {
		return String(storedHash) === String(plainText || '')
	}

	const parts = String(storedHash).split('$')
	if (parts.length !== 4) return false

	const iterations = Number(parts[1]) || ITERATIONS
	const salt = parts[2]
	const expectedHex = parts[3]
	const computedHex = crypto
		.pbkdf2Sync(String(plainText || ''), salt, iterations, KEYLEN, DIGEST)
		.toString('hex')

	const expectedBuffer = Buffer.from(expectedHex, 'hex')
	const computedBuffer = Buffer.from(computedHex, 'hex')
	if (expectedBuffer.length !== computedBuffer.length) return false
	return crypto.timingSafeEqual(expectedBuffer, computedBuffer)
}

module.exports = { hashPassword, verifyPassword, isHashedPassword }
