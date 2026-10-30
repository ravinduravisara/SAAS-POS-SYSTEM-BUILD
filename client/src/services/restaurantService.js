import api from './api'

export const getTables = () => api.get('/restaurant/tables').then((res) => res.data)
export const updateTableStatus = (id, status) => api.put(`/restaurant/tables/${id}/status`, { status }).then((res) => res.data)
export const createOrder = (payload) => api.post('/restaurant/orders', payload).then((res) => res.data)
export const updateOrderStatus = (id, status) => api.put(`/restaurant/orders/${id}/status`, { status }).then((res) => res.data)
export const getKitchenOrders = () => api.get('/restaurant/kitchen/orders').then((res) => res.data)

