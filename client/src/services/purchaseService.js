import api from './api'

const purchaseService = {
	async getAll() {
		const res = await api.get('/purchases')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/purchases', payload)
		return res.data
	},
}

export default purchaseService

