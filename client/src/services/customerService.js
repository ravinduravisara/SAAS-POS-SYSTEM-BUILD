import api from './api'

const customerService = {
	async getAll() {
		const res = await api.get('/customers')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/customers', payload)
		return res.data
	},

	async update(id, payload) {
		const res = await api.put(`/customers/${id}`, payload)
		return res.data
	},

	async remove(id) {
		const res = await api.delete(`/customers/${id}`)
		return res.data
	},
}

export default customerService
