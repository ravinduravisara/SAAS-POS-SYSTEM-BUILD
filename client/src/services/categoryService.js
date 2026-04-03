import api from './api'

const categoryService = {
	async getAll() {
		const res = await api.get('/categories')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/categories', payload)
		return res.data
	},

	async update(id, payload) {
		const res = await api.put(`/categories/${id}`, payload)
		return res.data
	},

	async remove(id) {
		const res = await api.delete(`/categories/${id}`)
		return res.data
	},
}

export default categoryService
