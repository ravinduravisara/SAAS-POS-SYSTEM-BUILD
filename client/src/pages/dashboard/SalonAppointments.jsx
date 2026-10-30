import { useState, useEffect, useMemo, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input from '../../components/common/Input.jsx'
import {
	getServices,
	getStylists,
	getAppointments,
	bookAppointment,
	updateAppointmentStatus,
} from '../../services/salonService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function SalonAppointments() {
	const [appointments, setAppointments] = useState([])
	const [stylists, setStylists] = useState([])
	const [services, setServices] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')
	const [searchQuery, setSearchQuery] = useState('')

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

	const loadData = useCallback(async () => {
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
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleStatusChange = useCallback(async (aptId, newStatus) => {
		try {
			await updateAppointmentStatus(aptId, newStatus)
			setSuccessMsg(`Appointment status updated to ${newStatus}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}, [loadData])

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

	const filteredAppointments = useMemo(() => {
		if (!searchQuery.trim()) return appointments
		const q = searchQuery.toLowerCase()
		return appointments.filter(
			(a) =>
				a.customerName?.toLowerCase().includes(q) ||
				a.customerPhone?.toLowerCase().includes(q) ||
				a.stylistName?.toLowerCase().includes(q) ||
				a.serviceName?.toLowerCase().includes(q),
		)
	}, [appointments, searchQuery])

	const columns = useMemo(
		() => [
			{
				label: 'Date & Time',
				key: 'appointmentDate',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.appointmentDate}</div>
						<div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 }}>
							{row.appointmentTime}
						</div>
					</div>
				),
			},
			{
				label: 'Customer Details',
				key: 'customerName',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.customerName}</div>
						<div style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.customerPhone}</div>
					</div>
				),
			},
			{
				label: 'Stylist / Specialist',
				key: 'stylistName',
				render: (row) => (
					<span style={{ fontWeight: 500, color: '#0f172a' }}>
						{row.stylistName}
					</span>
				),
			},
			{
				label: 'Service & Duration',
				key: 'serviceName',
				render: (row) => (
					<div>
						<div style={{ color: '#0f172a', fontWeight: 500 }}>{row.serviceName}</div>
						<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
							{row.durationMinutes} mins
						</div>
					</div>
				),
			},
			{
				label: 'Service Fee',
				key: 'price',
				render: (row) => (
					<span style={{ fontWeight: 700, color: '#0f172a' }}>
						{formatCurrency(row.price || 0)}
					</span>
				),
			},
			{
				label: 'Status',
				key: 'status',
				render: (row) => {
					if (row.status === 'completed') return <StatusBadge status="success" label="Completed" />
					if (row.status === 'in_progress') return <StatusBadge status="info" label="In Progress" />
					return <StatusBadge status="warning" label="Confirmed" />
				},
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '140px',
				render: (row) => (
					<div>
						{row.status === 'confirmed' && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => handleStatusChange(row.id, 'in_progress')}
							>
								Start Service
							</Button>
						)}
						{row.status === 'in_progress' && (
							<Button
								size="sm"
								onClick={() => handleStatusChange(row.id, 'completed')}
							>
								Complete & Bill
							</Button>
						)}
					</div>
				),
			},
		],
		[handleStatusChange],
	)

	return (
		<div className="stack">
			<PageHeader
				title="Salon & Spa Appointments"
				subtitle="Manage stylist schedules, client reservations, services catalog, and double-booking conflict prevention."
				actions={
					<Button onClick={() => setShowModal(true)}>+ Book Appointment</Button>
				}
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
					{successMsg}
				</div>
			)}

			<div className="card" style={{ padding: '1.25rem' }}>
				<DataTable
					columns={columns}
					data={filteredAppointments}
					loading={loading}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search appointment by customer, phone, or stylist..."
					emptyTitle="No appointments scheduled"
					emptyDescription="No salon appointments recorded yet."
					emptyActionText="+ Book Appointment"
					onEmptyAction={() => setShowModal(true)}
				/>
			</div>

			{/* Booking Modal */}
			<Modal
				title="Book Salon & Spa Appointment"
				open={showModal}
				onClose={() => setShowModal(false)}
			>
				<form onSubmit={handleSubmit} className="stack">
					<div className="grid grid--2">
						<Input
							label="Customer Name"
							placeholder="e.g. Nimasha Fernando"
							required
							value={form.customerName}
							onChange={(e) => setForm({ ...form, customerName: e.target.value })}
						/>
						<Input
							label="Customer Phone"
							placeholder="07xxxxxxxx"
							value={form.customerPhone}
							onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
						/>
					</div>

					<div className="grid grid--2">
						<div>
							<label className="label">Select Stylist</label>
							<select
								className="input"
								value={form.stylistId}
								onChange={(e) => setForm({ ...form, stylistId: e.target.value })}
							>
								{stylists.map((st) => (
									<option key={st.id} value={st.id}>
										{st.name} ({st.specialization})
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="label">Select Service</label>
							<select
								className="input"
								value={form.serviceId}
								onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
							>
								{services.map((srv) => (
									<option key={srv.id} value={srv.id}>
										{srv.name} ({formatCurrency(srv.price || 0)})
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid--2">
						<Input
							label="Appointment Date"
							type="date"
							required
							value={form.appointmentDate}
							onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
						/>
						<div>
							<label className="label">Time Slot</label>
							<select
								className="input"
								value={form.appointmentTime}
								onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
							>
								{['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((slot) => (
									<option key={slot} value={slot}>
										{slot}
									</option>
								))}
							</select>
						</div>
					</div>

					<Input
						label="Special Requests / Notes"
						placeholder="e.g. Hair color preference, allergy notes"
						value={form.notes}
						onChange={(e) => setForm({ ...form, notes: e.target.value })}
					/>

					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
							Cancel
						</Button>
						<Button type="submit">Confirm Reservation</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
