import { useState, useEffect, useCallback } from 'react'
import { getRepairJobs, createRepairJob, updateJobStatus } from '../../services/repairsService'
import { getProducts } from '../../services/productService'

export default function RepairJobs() {
	const [jobs, setJobs] = useState([])
	const [products, setProducts] = useState([])
	const [loading, setLoading] = useState(true)
	const [statusFilter, setStatusFilter] = useState('')
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')

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

	const handleStatusChange = async (jobId, newStatus) => {
		try {
			await updateJobStatus(jobId, newStatus)
			setSuccessMsg(`Job #${jobId} status updated to ${newStatus}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

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

	return (
		<div className="pos-screen" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
				<div>
					<h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Service Center & Repair Job Cards</h1>
					<p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
						Manage customer device diagnostics, work orders, technician assignments, and automatic spare part inventory deduction.
					</p>
				</div>
				<button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
					+ Create Job Card
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

			<div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
				<label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filter by Status:</label>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
				>
					<option value="">All Statuses</option>
					<option value="received">Received</option>
					<option value="repairing">Repairing</option>
					<option value="completed">Completed</option>
					<option value="delivered">Delivered</option>
				</select>
			</div>

			{loading ? (
				<p>Loading repair jobs...</p>
			) : jobs.length === 0 ? (
				<div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
					<p style={{ color: '#64748b' }}>No repair jobs recorded. Click &quot;+ Create Job Card&quot; to begin.</p>
				</div>
			) : (
				<div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
						<thead>
							<tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
								<th style={{ padding: '0.75rem 1rem' }}>Customer & Phone</th>
								<th style={{ padding: '0.75rem 1rem' }}>Device & Serial</th>
								<th style={{ padding: '0.75rem 1rem' }}>Problem Description</th>
								<th style={{ padding: '0.75rem 1rem' }}>Technician</th>
								<th style={{ padding: '0.75rem 1rem' }}>Cost Breakdown</th>
								<th style={{ padding: '0.75rem 1rem' }}>Status</th>
								<th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{jobs.map((j) => (
								<tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
									<td style={{ padding: '0.75rem 1rem' }}>
										<div style={{ fontWeight: 600 }}>{j.customerName}</div>
										<div style={{ color: '#64748b', fontSize: '0.8rem' }}>{j.customerPhone}</div>
									</td>
									<td style={{ padding: '0.75rem 1rem' }}>
										<div>{j.deviceModel}</div>
										{j.serialNumber && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>S/N: {j.serialNumber}</div>}
									</td>
									<td style={{ padding: '0.75rem 1rem', maxWidth: '250px' }}>{j.problemDescription}</td>
									<td style={{ padding: '0.75rem 1rem' }}>{j.technicianName}</td>
									<td style={{ padding: '0.75rem 1rem' }}>
										<div>Rs. {Number(j.totalCost || 0).toLocaleString()}</div>
										<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
											Labor: Rs. {j.laborCost} | Parts: Rs. {j.partsCost}
										</div>
									</td>
									<td style={{ padding: '0.75rem 1rem' }}>
										<span
											style={{
												padding: '0.2rem 0.5rem',
												borderRadius: '12px',
												fontSize: '0.75rem',
												fontWeight: 600,
												textTransform: 'uppercase',
												background: j.status === 'completed' || j.status === 'delivered' ? '#d1fae5' : '#fee2e2',
												color: j.status === 'completed' || j.status === 'delivered' ? '#047857' : '#b91c1c',
											}}
										>
											{j.status}
										</span>
									</td>
									<td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
										{j.status === 'received' && (
											<button
												type="button"
												className="btn btn--secondary"
												style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
												onClick={() => handleStatusChange(j.id, 'repairing')}
											>
												Start Repair
											</button>
										)}
										{j.status === 'repairing' && (
											<button
												type="button"
												className="btn btn--primary"
												style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
												onClick={() => handleStatusChange(j.id, 'completed')}
											>
												Complete & Restock
											</button>
										)}
										{j.status === 'completed' && (
											<button
												type="button"
												className="btn btn--secondary"
												style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
												onClick={() => handleStatusChange(j.id, 'delivered')}
											>
												Deliver to Client
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* New Job Modal */}
			{showModal && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
					<div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px' }}>
						<h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>Register Repair Job Card</h2>
						<form onSubmit={handleSubmit}>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Customer Name *</label>
									<input
										type="text"
										required
										value={form.customerName}
										onChange={(e) => setForm({ ...form, customerName: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Customer Phone</label>
									<input
										type="text"
										value={form.customerPhone}
										onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Device Model *</label>
									<input
										type="text"
										required
										placeholder="e.g. Dell XPS 15"
										value={form.deviceModel}
										onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Serial / IMEI</label>
									<input
										type="text"
										value={form.serialNumber}
										onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>

							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Problem Description</label>
								<textarea
									rows="2"
									value={form.problemDescription}
									onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Technician</label>
									<input
										type="text"
										value={form.technicianName}
										onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
										placeholder="e.g. Kamal"
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Labor Cost (Rs.)</label>
									<input
										type="number"
										step="any"
										value={form.laborCost}
										onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>

							<div style={{ marginBottom: '1rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Spare Part from Inventory</label>
								<div style={{ display: 'flex', gap: '0.5rem' }}>
									<select
										value={form.selectedPartId}
										onChange={(e) => setForm({ ...form, selectedPartId: e.target.value })}
										style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									>
										<option value="">No part selected</option>
										{products.map((p) => (
											<option key={p.id} value={p.id}>
												{p.name} (Stock: {p.stock} | Rs. {p.price})
											</option>
										))}
									</select>
									<input
										type="number"
										min="1"
										value={form.partQty}
										onChange={(e) => setForm({ ...form, partQty: e.target.value })}
										style={{ width: '60px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
								<button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button type="submit" className="btn btn--primary">
									Register Job
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
