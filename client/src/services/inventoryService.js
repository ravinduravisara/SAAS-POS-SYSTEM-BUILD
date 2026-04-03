import api from './api'

const inventoryService = {
	async list() {
		const res = await api.get('/inventory')
		return res.data
	},

	async setStock(productId, stock) {
		const res = await api.post('/inventory/set', { productId, stock })
		return res.data
	},

	async adjustStock(productId, delta) {
		const res = await api.post('/inventory/adjust', { productId, delta })
		return res.data
	},
}

export default inventoryService
