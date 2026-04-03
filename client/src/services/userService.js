import api from './api'

const userService = {
	async getAll() {
		const res = await api.get('/users')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/users', payload)
		return res.data
	},

	async update(id, payload) {
		const res = await api.put(`/users/${id}`, payload)
		return res.data
	},

	async remove(id) {
		const res = await api.delete(`/users/${id}`)
		return res.data
	},
}

export default userService
