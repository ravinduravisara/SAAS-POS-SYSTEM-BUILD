import api from './api'

const superAdminService = {
	getStats: () => api.get('/super-admin/stats').then((r) => r.data),
	getTenants: () => api.get('/super-admin/tenants').then((r) => r.data),
	getTenant: (id) => api.get(`/super-admin/tenants/${id}`).then((r) => r.data),
	updateStatus: (id, status) => api.put(`/super-admin/tenants/${id}/status`, { status }).then((r) => r.data),
	updatePlan: (id, plan) => api.put(`/super-admin/tenants/${id}/plan`, { plan }).then((r) => r.data),
	deleteTenant: (id) => api.delete(`/super-admin/tenants/${id}`).then((r) => r.data),
	getSubscriptions: () => api.get('/super-admin/subscriptions').then((r) => r.data),
	updateSubscription: (id, payload) => api.put(`/super-admin/subscriptions/${id}`, payload).then((r) => r.data),
}

export default superAdminService