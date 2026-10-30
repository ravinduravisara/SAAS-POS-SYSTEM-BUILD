import api from './api'

const salesService = {
	async createSale(payload, idempotencyKey = null) {
		const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
		const res = await api.post('/sales', payload, { headers })
		return res.data
	},

	async list(params = {}) {
		const res = await api.get('/sales', { params })
		return res.data
	},

	async getById(id) {
		const res = await api.get(`/sales/${id}`)
		return res.data
	},

	async refundSale(id, payload = {}) {
		const res = await api.post(`/sales/${id}/refund`, payload)
		return res.data
	},
}

export default salesService
