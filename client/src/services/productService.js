import api from './api'

const productService = {
	async getAll() {
		const res = await api.get('/products')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/products', payload)
		return res.data
	},

	async update(id, payload) {
		const res = await api.put(`/products/${id}`, payload)
		return res.data
	},

	async remove(id) {
		const res = await api.delete(`/products/${id}`)
		return res.data
	},
}

export const getProducts = () => productService.getAll()
export default productService
