import api from './api'

export const getEmployees = (params) => api.get('/hrm/employees', { params }).then((res) => res.data)
export const createEmployee = (payload) => api.post('/hrm/employees', payload).then((res) => res.data)
export const getAttendance = (params) => api.get('/hrm/attendance', { params }).then((res) => res.data)
export const recordAttendance = (payload) => api.post('/hrm/attendance', payload).then((res) => res.data)
export const getPayroll = (params) => api.get('/hrm/payroll', { params }).then((res) => res.data)
export const generatePayroll = (payload) => api.post('/hrm/payroll/generate', payload).then((res) => res.data)
export const markPayrollPaid = (id) => api.put(`/hrm/payroll/${id}/pay`).then((res) => res.data)

