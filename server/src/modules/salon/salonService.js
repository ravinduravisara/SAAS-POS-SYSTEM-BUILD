const { getSupabase } = require('../../config/db')
const { round } = require('../../../../shared/utils/decimal')

async function listServices(tenantId) {
	const db = getSupabase()
	const { data, error } = await db
		.from('salon_services')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('name', { ascending: true })
	if (error) throw error

	if (!data || data.length === 0) {
		const initialServices = [
			{ tenant_id: tenantId, name: 'Haircut & Styling', duration_minutes: 45, price: 1500 },
			{ tenant_id: tenantId, name: 'Facial Treatment', duration_minutes: 60, price: 3500 },
			{ tenant_id: tenantId, name: 'Manicure & Pedicure', duration_minutes: 50, price: 2500 },
		]
		const { data: seeded } = await db.from('salon_services').insert(initialServices).select()
		return (seeded || initialServices).map((s) => ({
			id: s.id,
			name: s.name,
			durationMinutes: s.duration_minutes,
			price: Number(s.price || 0),
		}))
	}

	return data.map((s) => ({
		id: s.id,
		name: s.name,
		durationMinutes: s.duration_minutes,
		price: Number(s.price || 0),
	}))
}

async function createService(tenantId, payload) {
	const name = String(payload.name || '').trim()
	if (!name) {
		const err = new Error('Service name is required')
		err.status = 400
		throw err
	}
	const price = Number(payload.price || 0)
	const durationMinutes = Math.max(15, parseInt(payload.durationMinutes, 10) || 30)

	const { data, error } = await getSupabase()
		.from('salon_services')
		.insert({
			tenant_id: tenantId,
			name,
			duration_minutes: durationMinutes,
			price: round(price, 2),
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: data.id,
		name: data.name,
		durationMinutes: data.duration_minutes,
		price: Number(data.price),
	}
}

async function listStylists(tenantId) {
	const db = getSupabase()
	const { data, error } = await db
		.from('salon_stylists')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('name', { ascending: true })
	if (error) throw error

	if (!data || data.length === 0) {
		const initialStylists = [
			{ tenant_id: tenantId, name: 'Elena Rostova', specialization: 'Master Hair Stylist', phone: '0771234001', status: 'active' },
			{ tenant_id: tenantId, name: 'Marcus Vance', specialization: 'Color Specialist', phone: '0771234002', status: 'active' },
		]
		const { data: seeded } = await db.from('salon_stylists').insert(initialStylists).select()
		return (seeded || initialStylists).map((st) => ({
			id: st.id,
			name: st.name,
			specialization: st.specialization,
			phone: st.phone,
			status: st.status,
		}))
	}

	return data.map((st) => ({
		id: st.id,
		name: st.name,
		specialization: st.specialization,
		phone: st.phone,
		status: st.status,
	}))
}

async function createStylist(tenantId, payload) {
	const name = String(payload.name || '').trim()
	if (!name) {
		const err = new Error('Stylist name is required')
		err.status = 400
		throw err
	}

	const { data, error } = await getSupabase()
		.from('salon_stylists')
		.insert({
			tenant_id: tenantId,
			name,
			specialization: payload.specialization || 'General Stylist',
			phone: payload.phone || '',
			status: 'active',
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: data.id,
		name: data.name,
		specialization: data.specialization,
		phone: data.phone,
		status: data.status,
	}
}

async function listAppointments(tenantId, filters = {}) {
	const db = getSupabase()
	let q = db.from('salon_appointments').select('*').eq('tenant_id', tenantId).order('appointment_date', { ascending: false })
	if (filters.date) {
		q = q.eq('appointment_date', filters.date)
	}
	if (filters.stylistId) {
		q = q.eq('stylist_id', filters.stylistId)
	}
	const { data, error } = await q
	if (error) throw error

	return (data || []).map((a) => ({
		id: a.id,
		customerName: a.customer_name,
		customerPhone: a.customer_phone || '',
		stylistId: a.stylist_id,
		stylistName: a.stylist_name,
		serviceId: a.service_id,
		serviceName: a.service_name,
		appointmentDate: a.appointment_date,
		appointmentTime: a.appointment_time,
		durationMinutes: a.duration_minutes,
		price: Number(a.price || 0),
		status: a.status,
		notes: a.notes || '',
		createdAt: a.created_at,
	}))
}

async function bookAppointment(tenantId, payload) {
	const db = getSupabase()
	const customerName = String(payload.customerName || '').trim()
	const stylistId = payload.stylistId
	const serviceId = payload.serviceId
	const appointmentDate = payload.appointmentDate
	const appointmentTime = payload.appointmentTime

	if (!customerName || !stylistId || !appointmentDate || !appointmentTime) {
		const err = new Error('Customer name, stylist, appointment date, and appointment time are required')
		err.status = 400
		throw err
	}

	// 1. Conflict Prevention: Check if the stylist is already booked at that date & time
	const { data: conflicts } = await db
		.from('salon_appointments')
		.select('id, appointment_date, appointment_time, customer_name')
		.eq('tenant_id', tenantId)
		.eq('stylist_id', stylistId)
		.eq('appointment_date', appointmentDate)
		.eq('appointment_time', appointmentTime)

	const activeConflicts = (conflicts || []).filter((c) => c.status !== 'cancelled')
	if (activeConflicts.length > 0) {
		const err = new Error(`Stylist is already booked for ${appointmentDate} at ${appointmentTime}`)
		err.status = 409
		throw err
	}

	// 2. Fetch Stylist & Service details
	let stylistName = payload.stylistName || 'Assigned Stylist'
	const { data: stData } = await db.from('salon_stylists').select('name').eq('id', stylistId).eq('tenant_id', tenantId).maybeSingle()
	if (stData) stylistName = stData.name

	let serviceName = payload.serviceName || 'Custom Service'
	let servicePrice = Number(payload.price || 0)
	let durationMinutes = Number(payload.durationMinutes || 45)

	if (serviceId) {
		const { data: sData } = await db.from('salon_services').select('name, price, duration_minutes').eq('id', serviceId).eq('tenant_id', tenantId).maybeSingle()
		if (sData) {
			serviceName = sData.name
			servicePrice = Number(sData.price || 0)
			durationMinutes = sData.duration_minutes || 45
		}
	}

	const { data: apt, error } = await db
		.from('salon_appointments')
		.insert({
			tenant_id: tenantId,
			customer_name: customerName,
			customer_phone: payload.customerPhone || '',
			stylist_id: stylistId,
			stylist_name: stylistName,
			service_id: serviceId || null,
			service_name: serviceName,
			appointment_date: appointmentDate,
			appointment_time: appointmentTime,
			duration_minutes: durationMinutes,
			price: round(servicePrice, 2),
			status: 'confirmed',
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: apt.id,
		customerName: apt.customer_name,
		customerPhone: apt.customer_phone,
		stylistId: apt.stylist_id,
		stylistName: apt.stylist_name,
		serviceId: apt.service_id,
		serviceName: apt.service_name,
		appointmentDate: apt.appointment_date,
		appointmentTime: apt.appointment_time,
		durationMinutes: apt.duration_minutes,
		price: Number(apt.price),
		status: apt.status,
		notes: apt.notes,
		createdAt: apt.created_at,
	}
}

async function updateAppointmentStatus(tenantId, appointmentId, status) {
	const validStatuses = new Set(['confirmed', 'in_progress', 'completed', 'cancelled'])
	if (!validStatuses.has(status)) {
		const err = new Error('Invalid appointment status')
		err.status = 400
		throw err
	}

	const { data, error } = await getSupabase()
		.from('salon_appointments')
		.update({ status })
		.eq('id', appointmentId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	return data
}

module.exports = {
	listServices,
	createService,
	listStylists,
	createStylist,
	listAppointments,
	bookAppointment,
	updateAppointmentStatus,
}

