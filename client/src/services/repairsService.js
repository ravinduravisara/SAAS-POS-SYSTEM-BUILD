import api from './api'

export const getRepairJobs = (params) => api.get('/repairs/jobs', { params }).then((res) => res.data)
export const createRepairJob = (payload) => api.post('/repairs/jobs', payload).then((res) => res.data)
export const updateJobStatus = (id, status, spareParts) => api.put(`/repairs/jobs/${id}/status`, { status, spareParts }).then((res) => res.data)

