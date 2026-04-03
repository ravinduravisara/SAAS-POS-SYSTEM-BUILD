import api from './api'

const reportService = {
	async getSummary(params) {
		const res = await api.get('/reports/summary', { params })
		return res.data
	},
}

export default reportService
