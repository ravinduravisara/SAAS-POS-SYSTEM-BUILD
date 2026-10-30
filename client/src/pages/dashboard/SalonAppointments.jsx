import { useState, useEffect } from 'react'
import {
	getServices,
	getStylists,
	getAppointments,
	bookAppointment,
	updateAppointmentStatus,
} from '../../services/salonService'

export default function SalonAppointments() {
	const [appointments, setAppointments] = useState([])
	const [stylists, setStylists] = useState([])
	const [services, setServices] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')

	// Modal State
	const [showModal, setShowModal] = useState(false)
	const [form, setForm] = useState({
		customerName: '',
		customerPhone: '',
		stylistId: '',
		serviceId: '',
		appointmentDate: new Date().toISOString().slice(0, 10),
		appointmentTime: '10:00',
		notes: '',
	})

	const loadData = async () => {
		try {
			setLoading(true)
			setError('')
			const [apts, stList, srvList] = await Promise.all([
				getAppointments(),
				getStylists(),
				getServices(),
			])
			setAppointments(apts || [])
			setStylists(stList || [])
			setServices(srvList || [])
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to load appointments')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleStatusChange = async (aptId, newStatus) => {
		try {
			await updateAppointmentStatus(aptId, newStatus)
			setSuccessMsg(`Appointment status updated to ${newStatus}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			await bookAppointment({
				customerName: form.customerName,
				customerPhone: form.customerPhone,
				stylistId: form.stylistId || stylists[0]?.id,
				serviceId: form.serviceId || services[0]?.id,
				appointmentDate: form.appointmentDate,
				appointmentTime: form.appointmentTime,
				notes: form.notes,
			})
			setSuccessMsg('Appointment booked successfully')
			setTimeout(() => setSuccessMsg(''), 3000)
			setShowModal(false)
			setForm({
				customerName: '',
				customerPhone: '',
				stylistId: '',
				serviceId: '',
				appointmentDate: new Date().toISOString().slice(0, 10),
				appointmentTime: '10:00',
				notes: '',
			})
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	return (
		<div className="pos-screen" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
				<div>
					<h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Salon & Spa Appointments</h1>
					<p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
						Manage stylist schedules, client appointments, services catalog, and double-booking conflict prevention.
					</p>
				</div>
				<button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
					+ Book Appointment
				</button>
			</div>

			{error && (
				<div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '6px', marginBottom: '1rem' }}>
					{successMsg}
				</div>
			)}

			{loading ? (
				<p>Loading appointments...</p>
			) : appointments.length === 0 ? (
				<div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
					<p style={{ color: '#64748b' }}>No appointments scheduled. Click &quot;+ Book Appointment&quot; to reserve a slot.</p>
				</div>
			) : (
				<div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
						<thead>
							<tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
								<th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
								<th style={{ padding: '0.75rem 1rem' }}>Customer & Phone</th>
								<th style={{ padding: '0.75rem 1rem' }}>Stylist</th>
								<th style={{ padding: '0.75rem 1rem' }}>Service & Duration</th>
								<th style={{ padding: '0.75rem 1rem' }}>Fee</th>
								<th style={{ padding: '0.75rem 1rem' }}>Status</th>
								<th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{appointments.map((a) => (
								<tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
									<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
										<div>{a.appointmentDate}</div>
										<div style={{ color: '#2563eb', fontSize: '0.8rem' }}>{a.appointmentTime}</div>
									</td>
									<td style={{ padding: '0.75rem 1rem' }}>
										<div style={{ fontWeight: 600 }}>{a.customerName}</div>
										<div style={{ color: '#64748b', fontSize: '0.8rem' }}>{a.customerPhone}</div>
									</td>
									<td style={{ padding: '0.75rem 1rem' }}>{a.stylistName}</td>
									<td style={{ padding: '0.75rem 1rem' }}>
										<div>{a.serviceName}</div>
										<div style={{ color: '#64748b', fontSize: '0.75rem' }}>{a.durationMinutes} mins</div>
									</td>
									<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
										Rs. {Number(a.price || 0).toLocaleString()}
									</td>
									<td style={{ padding: '0.75rem 1rem' }}>
										<span
											style={{
												padding: '0.2rem 0.5rem',
												borderRadius: '12px',
												fontSize: '0.75rem',
												fontWeight: 600,
												textTransform: 'uppercase',
												background: a.status === 'completed' ? '#d1fae5' : a.status === 'in_progress' ? '#e0f2fe' : '#fef3c7',
												color: a.status === 'completed' ? '#047857' : a.status === 'in_progress' ? '#0369a1' : '#b45309',
											}}
										>
											{a.status}
										</span>
									</td>
									<td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
										{a.status === 'confirmed' && (
											<button
												type="button"
												className="btn btn--secondary"
												style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
												onClick={() => handleStatusChange(a.id, 'in_progress')}
											>
												Start Service
											</button>
										)}
										{a.status === 'in_progress' && (
											<button
												type="button"
												className="btn btn--primary"
												style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
												onClick={() => handleStatusChange(a.id, 'completed')}
											>
												Complete & Bill
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Booking Modal */}
			{showModal && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
					<div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
						<h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>Book Salon Appointment</h2>
						<form onSubmit={handleSubmit}>
							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Customer Name *</label>
								<input
									type="text"
									required
									value={form.customerName}
									onChange={(e) => setForm({ ...form, customerName: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>

							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Customer Phone</label>
								<input
									type="text"
									value={form.customerPhone}
									onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Select Stylist *</label>
									<select
										value={form.stylistId}
										onChange={(e) => setForm({ ...form, stylistId: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									>
										{stylists.map((st) => (
											<option key={st.id} value={st.id}>
												{st.name} ({st.specialization})
											</option>
										))}
									</select>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Select Service *</label>
									<select
										value={form.serviceId}
										onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									>
										{services.map((srv) => (
											<option key={srv.id} value={srv.id}>
												{srv.name} (Rs. {srv.price})
											</option>
										))}
									</select>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Date *</label>
									<input
										type="date"
										required
										value={form.appointmentDate}
										onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Time Slot *</label>
									<select
										value={form.appointmentTime}
										onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									>
										{['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((slot) => (
											<option key={slot} value={slot}>
												{slot}
											</option>
										))}
									</select>
								</div>
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
								<button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button type="submit" className="btn btn--primary">
									Confirm Booking
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

