import { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input from '../../components/common/Input.jsx'
import { getRepairJobs, createRepairJob, updateJobStatus } from '../../services/repairsService'
import { getProducts } from '../../services/productService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function RepairJobs() {
	const [jobs, setJobs] = useState([])
	const [products, setProducts] = useState([])
	const [loading, setLoading] = useState(true)
	const [statusFilter, setStatusFilter] = useState('')
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')
	const [searchQuery, setSearchQuery] = useState('')

	// Modal state
	const [showModal, setShowModal] = useState(false)
	const [form, setForm] = useState({
		customerName: '',
		customerPhone: '',
		deviceModel: '',
		serialNumber: '',
		problemDescription: '',
		technicianName: '',
		laborCost: 2000,
		selectedPartId: '',
		partQty: 1,
	})

	const loadData = useCallback(async () => {
		try {
			setLoading(true)
			setError('')
			const [jobsData, productsData] = await Promise.all([
				getRepairJobs(statusFilter ? { status: statusFilter } : {}),
				getProducts(),
			])
			setJobs(jobsData || [])
			setProducts(productsData || [])
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to load repair jobs')
		} finally {
			setLoading(false)
		}
	}, [statusFilter])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleStatusChange = useCallback(async (jobId, newStatus) => {
		try {
			await updateJobStatus(jobId, newStatus)
			setSuccessMsg(`Job #${jobId} status updated to ${newStatus}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}, [loadData])

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			const spareParts = []
			if (form.selectedPartId) {
				const prod = products.find((p) => p.id === form.selectedPartId)
				if (prod) {
					spareParts.push({
						productId: prod.id,
						name: prod.name,
						price: Number(prod.price || 0),
						quantity: Number(form.partQty || 1),
					})
				}
			}

			await createRepairJob({
				customerName: form.customerName,
				customerPhone: form.customerPhone,
				deviceModel: form.deviceModel,
				serialNumber: form.serialNumber,
				problemDescription: form.problemDescription,
				technicianName: form.technicianName,
				laborCost: Number(form.laborCost || 0),
				spareParts,
			})

			setSuccessMsg('Repair job card registered successfully')
			setTimeout(() => setSuccessMsg(''), 3000)
			setShowModal(false)
			setForm({
				customerName: '',
				customerPhone: '',
				deviceModel: '',
				serialNumber: '',
				problemDescription: '',
				technicianName: '',
				laborCost: 2000,
				selectedPartId: '',
				partQty: 1,
			})
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const filteredJobs = useMemo(() => {
		if (!searchQuery.trim()) return jobs
		const q = searchQuery.toLowerCase()
		return jobs.filter(
			(j) =>
				j.customerName?.toLowerCase().includes(q) ||
				j.customerPhone?.toLowerCase().includes(q) ||
				j.deviceModel?.toLowerCase().includes(q) ||
				j.serialNumber?.toLowerCase().includes(q) ||
				j.technicianName?.toLowerCase().includes(q),
		)
	}, [jobs, searchQuery])

	const columns = useMemo(
		() => [
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
				label: 'Device & Hardware',
				key: 'deviceModel',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 500, color: '#0f172a' }}>{row.deviceModel}</div>
						{row.serialNumber && (
							<div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
								S/N: {row.serialNumber}
							</div>
						)}
					</div>
				),
			},
			{
				label: 'Diagnosis / Issue',
				key: 'problemDescription',
				render: (row) => (
					<div style={{ fontSize: '0.85rem', color: '#334155', maxWidth: '220px' }}>
						{row.problemDescription}
					</div>
				),
			},
			{
				label: 'Assigned Tech',
				key: 'technicianName',
				render: (row) => (
					<span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
						{row.technicianName || 'Unassigned'}
					</span>
				),
			},
			{
				label: 'Total Cost',
				key: 'totalCost',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 700, color: '#0f172a' }}>
							{formatCurrency(row.totalCost || 0)}
						</div>
						<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
							Labor: {formatCurrency(row.laborCost || 0)} | Parts: {formatCurrency(row.partsCost || 0)}
						</div>
					</div>
				),
			},
			{
				label: 'Status',
				key: 'status',
				render: (row) => {
					const s = row.status
					if (s === 'delivered') return <StatusBadge status="success" label="Delivered" />
					if (s === 'completed') return <StatusBadge status="primary" label="Completed" />
					if (s === 'repairing') return <StatusBadge status="warning" label="In Repair" />
					return <StatusBadge status="info" label="Received" />
				},
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '140px',
				render: (row) => (
					<div>
						{row.status === 'received' && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => handleStatusChange(row.id, 'repairing')}
							>
								Start Repair
							</Button>
						)}
						{row.status === 'repairing' && (
							<Button
								size="sm"
								onClick={() => handleStatusChange(row.id, 'completed')}
							>
								Complete Job
							</Button>
						)}
						{row.status === 'completed' && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => handleStatusChange(row.id, 'delivered')}
							>
								Deliver to Client
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
				title="Service Center & Repair Job Cards"
				subtitle="Manage device diagnostics, service orders, technician dispatch, and automated spare parts deduction."
				actions={
					<Button onClick={() => setShowModal(true)}>+ Register Job Card</Button>
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
					data={filteredJobs}
					loading={loading}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search repair job by customer, device, or serial #..."
					actions={
						<select
							className="input"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							style={{ width: '160px', padding: '0.45rem 0.6rem' }}
						>
							<option value="">All Statuses</option>
							<option value="received">Received</option>
							<option value="repairing">Repairing</option>
							<option value="completed">Completed</option>
							<option value="delivered">Delivered</option>
						</select>
					}
					emptyTitle="No repair jobs found"
					emptyDescription="No repair job cards registered yet or matching your filter."
					emptyActionText="+ Register Job Card"
					onEmptyAction={() => setShowModal(true)}
				/>
			</div>

			{/* New Job Modal */}
			<Modal
				title="Register Repair Job Card"
				open={showModal}
				onClose={() => setShowModal(false)}
			>
				<form onSubmit={handleSubmit} className="stack">
					<div className="grid grid--2">
						<Input
							label="Customer Name"
							placeholder="e.g. Priyantha Silva"
							required
							value={form.customerName}
							onChange={(e) => setForm({ ...form, customerName: e.target.value })}
						/>
						<Input
							label="Contact Phone"
							placeholder="077xxxxxxx"
							value={form.customerPhone}
							onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
						/>
					</div>

					<div className="grid grid--2">
						<Input
							label="Device Model"
							placeholder="e.g. MacBook Pro M1 14&quot;"
							required
							value={form.deviceModel}
							onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
						/>
						<Input
							label="Serial # / IMEI"
							placeholder="e.g. C02ABC123DEF"
							value={form.serialNumber}
							onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
						/>
					</div>

					<Input
						label="Problem Description / Symptoms"
						placeholder="e.g. Display backlight flickering, battery drains fast"
						value={form.problemDescription}
						onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
					/>

					<div className="grid grid--2">
						<Input
							label="Assigned Technician"
							placeholder="e.g. Kamal"
							value={form.technicianName}
							onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
						/>
						<Input
							label="Labor Cost"
							type="number"
							step="any"
							value={form.laborCost}
							onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
						/>
					</div>

					<div>
						<label className="label">Spare Part from Stock (Auto-Deducts on Save)</label>
						<div style={{ display: 'flex', gap: '8px' }}>
							<select
								className="input"
								value={form.selectedPartId}
								onChange={(e) => setForm({ ...form, selectedPartId: e.target.value })}
								style={{ flex: 1 }}
							>
								<option value="">No spare part required</option>
								{products.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} (Stock: {p.stock} | {formatCurrency(p.price || 0)})
									</option>
								))}
							</select>
							<input
								type="number"
								min="1"
								value={form.partQty}
								onChange={(e) => setForm({ ...form, partQty: e.target.value })}
								className="input"
								style={{ width: '70px' }}
							/>
						</div>
					</div>

					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
							Cancel
						</Button>
						<Button type="submit">Create Job Card</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
