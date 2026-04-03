import api from './api'

const settingsService = {
	async get() {
		const res = await api.get('/settings')
		return res.data
	},

	async update(payload) {
		const res = await api.put('/settings', payload)
		return res.data
	},
}

export default settingsService
