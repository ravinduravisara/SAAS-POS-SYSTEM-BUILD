const crypto = require('crypto')

function generateToken() {
	return crypto.randomUUID()
}

module.exports = generateToken
