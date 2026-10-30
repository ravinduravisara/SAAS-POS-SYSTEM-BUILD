import api from './api'

export const getServices = () => api.get('/salon/services').then((res) => res.data)
export const createService = (payload) => api.post('/salon/services', payload).then((res) => res.data)
export const getStylists = () => api.get('/salon/stylists').then((res) => res.data)
export const createStylist = (payload) => api.post('/salon/stylists', payload).then((res) => res.data)
export const getAppointments = (params) => api.get('/salon/appointments', { params }).then((res) => res.data)
export const bookAppointment = (payload) => api.post('/salon/appointments', payload).then((res) => res.data)
export const updateAppointmentStatus = (id, status) => api.put(`/salon/appointments/${id}/status`, { status }).then((res) => res.data)

