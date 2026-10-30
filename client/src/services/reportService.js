import api from './api'

const reportService = {
	async getSummary(params = {}) {
		const res = await api.get('/reports/summary', { params })
		return res.data
	},

	async exportCsv(params = {}) {
		const res = await api.get('/reports/export', {
			params,
			responseType: 'blob',
		})
		const url = window.URL.createObjectURL(new Blob([res.data]))
		const link = document.createElement('a')
		link.href = url
		link.setAttribute('download', `sales_report_${Date.now()}.csv`)
		document.body.appendChild(link)
		link.click()
		link.remove()
	},
}

export default reportService
