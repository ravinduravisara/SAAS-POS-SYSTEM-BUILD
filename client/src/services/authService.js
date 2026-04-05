import api from './api'

const authService = {
	async login({ email, password }) {
		const res = await api.post('/auth/login', { email, password })
		return res.data
	},

	async register(payload) {
		const res = await api.post('/auth/register', payload)
		return res.data
	},

	async me() {
		const res = await api.get('/auth/me')
		return res.data
	},
}

export default authService
