import api from './api'

const expenseService = {
	async getAll() {
		const res = await api.get('/expenses')
		return res.data
	},

	async create(payload) {
		const res = await api.post('/expenses', payload)
		return res.data
	},

	async remove(id) {
		const res = await api.delete(`/expenses/${id}`)
		return res.data
	},
}

export default expenseService

