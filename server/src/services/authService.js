const generateToken = require('../utils/generateToken')
const { store } = require('../data/store')

async function login({ email, password }) {
	const user = store.users.find(
		(u) => u.email.toLowerCase() === String(email || '').toLowerCase(),
	)

	if (!user || user.password !== password) {
		const err = new Error('Invalid credentials')
		err.status = 401
		throw err
	}

	const token = generateToken()
	return {
		token,
		user: { id: user.id, name: user.name, email: user.email, role: user.role },
	}
}

async function register({ name, email, password }) {
	const exists = store.users.some(
		(u) => u.email.toLowerCase() === String(email || '').toLowerCase(),
	)
	if (exists) {
		const err = new Error('Email already registered')
		err.status = 409
		throw err
	}

	const newUser = {
		id: `u_${Date.now()}`,
		name: name || 'User',
		email,
		role: 'cashier',
		password,
	}

	store.users.push(newUser)
	return { id: newUser.id }
}

module.exports = { login, register }
