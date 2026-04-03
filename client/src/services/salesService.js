import api from './api'

const salesService = {
	async createSale(payload) {
		const res = await api.post('/sales', payload)
		return res.data
	},

	async list() {
		const res = await api.get('/sales')
		return res.data
	},
}

export default salesService
