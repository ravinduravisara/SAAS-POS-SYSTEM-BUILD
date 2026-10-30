import api from './api'

const supplierService = {
	async getAll() {
		const res = await api.get('/suppliers')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/suppliers', payload)
		return res.data
	},

	async update(id, payload) {
		const res = await api.put(`/suppliers/${id}`, payload)
		return res.data
	},

	async remove(id) {
		const res = await api.delete(`/suppliers/${id}`)
		return res.data
	},
}

export default supplierService

