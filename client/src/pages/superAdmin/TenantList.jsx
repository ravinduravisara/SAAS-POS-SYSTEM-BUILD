import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import superAdminService from '../../services/superAdminService'
import { formatDate } from '../../utils/formatDate'

const STATUS_COLORS = {
	active: { bg: '#dcfce7', text: '#166534' },
	trial: { bg: '#fef3c7', text: '#92400e' },
	past_due: { bg: '#ffedd5', text: '#9a3412' },
	suspended: { bg: '#fee2e2', text: '#991b1b' },
	cancelled: { bg: '#f1f5f9', text: '#475569' },
	expired: { bg: '#fee2e2', text: '#991b1b' },
	archived: { bg: '#e2e8f0', text: '#334155' },
}

export default function TenantList() {
	const [tenants, setTenants] = useState([])
	const [loading, setLoading] = useState(true)
	const [modalOpen, setModalOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState(null)

	const [form, setForm] = useState({
		name: '',
		businessType: 'retail',
		registrationNumber: '',
		email: '',
		phone: '',
		plan: 'pro',
		status: 'trial',
		trialDays: 14,
		currency: 'LKR',
		adminName: '',
		adminEmail: '',
		adminPassword: '',
		maxUsers: 5,
		maxProducts: 500,
	})

	useEffect(() => {
		let active = true
		superAdminService
			.getTenants()
			.then((data) => {
				if (active) {
					setTenants(data)
					setLoading(false)
				}
			})
			.catch((err) => {
				if (active) {
					setError(err?.response?.data?.message || err?.message || 'Failed to load tenants')
					setLoading(false)
				}
			})
		return () => {
			active = false
		}
	}, [])

	async function reloadTenants() {
		try {
			const data = await superAdminService.getTenants()
			setTenants(data)
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to refresh')
		}
	}

	async function handleCreateTenant(e) {
		e.preventDefault()
		setError(null)
		if (!form.adminPassword || form.adminPassword.length < 8) {
			setError('Admin password must be at least 8 characters long')
			return
		}
		setSubmitting(true)
		try {
			await superAdminService.createTenant({
				...form,
				adminEmail: form.adminEmail || form.email,
				industryPreset: form.businessType,
			})
			setModalOpen(false)
			setForm({
				name: '',
				businessType: 'retail',
				registrationNumber: '',
				email: '',
				phone: '',
				plan: 'pro',
				status: 'trial',
				trialDays: 14,
				currency: 'LKR',
				adminName: '',
				adminEmail: '',
				adminPassword: '',
				maxUsers: 5,
				maxProducts: 500,
			})
			await reloadTenants()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Tenant onboarding failed')
		} finally {
			setSubmitting(false)
		}
	}

	const filteredTenants = useMemo(() => {
		return tenants.filter((t) => {
			const matchesQuery =
				!searchQuery ||
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.slug.toLowerCase().includes(searchQuery.toLowerCase())
			const matchesStatus = statusFilter === 'all' || t.status === statusFilter
			return matchesQuery && matchesStatus
		})
	}, [tenants, searchQuery, statusFilter])

	const columns = useMemo(
		() => [
			{
				header: 'Business Name',
				key: 'name',
				render: (row) => (
					<div>
						<div className="bold">{row.name}</div>
						<div className="muted" style={{ fontSize: '0.8rem' }}>{row.email} | {row.slug}</div>
					</div>
				),
			},
			{
				header: 'Type',
				key: 'businessType',
				render: (row) => (
					<span className="badge" style={{ textTransform: 'capitalize' }}>
						{row.businessType || 'Retail'}
					</span>
				),
			},
			{
				header: 'Plan',
				key: 'plan',
				render: (row) => (
					<span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#0f766e' }}>
						{row.plan}
					</span>
				),
			},
			{
				header: 'Status',
				key: 'status',
				render: (row) => {
					const colors = STATUS_COLORS[row.status] || { bg: '#f1f5f9', text: '#334155' }
					return (
						<span
							style={{
								padding: '3px 8px',
								borderRadius: '4px',
								fontSize: '0.8rem',
								fontWeight: 'bold',
								backgroundColor: colors.bg,
								color: colors.text,
							}}
						>
							{String(row.status || 'trial').toUpperCase()}
						</span>
					)
				},
			},
			{
				header: 'Users',
				key: 'userCount',
				render: (row) => row.userCount || 0,
			},
			{
				header: 'Created',
				key: 'createdAt',
				render: (row) => formatDate(row.createdAt),
			},
			{
				header: 'Actions',
				key: 'actions',
				render: (row) => (
					<Link to={`/super-admin/tenants/${row.id}`}>
						<Button variant="secondary">Manage / Config</Button>
					</Link>
				),
			},
		],
		[],
	)

	return (
		<div className="stack">
			<div className="row row--space">
				<div>
					<h2 className="h2" style={{ margin: 0 }}>Business Tenant Workspaces</h2>
					<div className="muted">Manage all multi-tenant businesses, plans, modules, and limits.</div>
				</div>
				<Button onClick={() => setModalOpen(true)}>+ Onboard New Business</Button>
			</div>

			{error ? <div className="card error">{error}</div> : null}

			<div className="card row row--space" style={{ gap: '1rem', flexWrap: 'wrap' }}>
				<Input
					placeholder="Search by business name, slug, email..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					style={{ flex: 2, minWidth: '260px' }}
				/>
				<div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
					<span className="muted">Status:</span>
					<select
						className="input"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="all">All Statuses</option>
						<option value="active">Active</option>
						<option value="trial">Trial</option>
						<option value="past_due">Past Due</option>
						<option value="suspended">Suspended</option>
						<option value="cancelled">Cancelled</option>
						<option value="expired">Expired</option>
					</select>
				</div>
			</div>

			{loading ? (
				<div className="card muted">Loading tenant directory...</div>
			) : (
				<Table columns={columns} data={filteredTenants} />
			)}

			{/* Onboard Business Modal */}
			<Modal
				title="Onboard New Business Workspace"
				open={modalOpen}
				onClose={() => setModalOpen(false)}
			>
				<form className="stack" onSubmit={handleCreateTenant}>
					<div className="grid grid--2">
						<Input
							label="Business Name"
							placeholder="e.g. ABC Supermarket"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							required
						/>
						<div>
							<label className="label">Industry Preset</label>
							<select
								className="input"
								value={form.businessType}
								onChange={(e) => setForm({ ...form, businessType: e.target.value })}
							>
								<option value="retail">Retail Shop / Boutique</option>
								<option value="supermarket">Supermarket / Grocery</option>
								<option value="restaurant">Restaurant / Café</option>
								<option value="pharmacy">Pharmacy / Healthcare</option>
								<option value="service_center">Service Center / Repairs</option>
								<option value="salon">Salon / Appointments</option>
								<option value="wholesale">Wholesale / Distribution</option>
							</select>
						</div>
					</div>

					<div className="grid grid--2">
						<Input
							label="Business Email"
							type="email"
							placeholder="billing@abcretail.com"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							required
						/>
						<Input
							label="Phone Number"
							placeholder="+94 11 234 5678"
							value={form.phone}
							onChange={(e) => setForm({ ...form, phone: e.target.value })}
						/>
					</div>

					<div className="grid grid--3">
						<div>
							<label className="label">Subscription Plan</label>
							<select
								className="input"
								value={form.plan}
								onChange={(e) => setForm({ ...form, plan: e.target.value })}
							>
								<option value="starter">Starter Plan ($9.99/mo)</option>
								<option value="pro">Pro Plan ($29.99/mo)</option>
								<option value="enterprise">Enterprise Plan ($99.99/mo)</option>
							</select>
						</div>
						<div>
							<label className="label">Account Status</label>
							<select
								className="input"
								value={form.status}
								onChange={(e) => setForm({ ...form, status: e.target.value })}
							>
								<option value="trial">Free Trial</option>
								<option value="active">Active (Paid)</option>
							</select>
						</div>
						<div>
							<label className="label">Currency</label>
							<select
								className="input"
								value={form.currency}
								onChange={(e) => setForm({ ...form, currency: e.target.value })}
							>
								<option value="LKR">LKR (Sri Lankan Rupee)</option>
								<option value="USD">USD (US Dollar)</option>
								<option value="EUR">EUR (Euro)</option>
								<option value="GBP">GBP (British Pound)</option>
								<option value="INR">INR (Indian Rupee)</option>
							</select>
						</div>
					</div>

					<div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
						<h4 className="h4" style={{ margin: '0 0 0.5rem 0' }}>Initial Business Owner Credentials</h4>
						<div className="grid grid--3">
							<Input
								label="Owner Name"
								placeholder="e.g. John Silva"
								value={form.adminName}
								onChange={(e) => setForm({ ...form, adminName: e.target.value })}
								required
							/>
							<Input
								label="Owner Login Email"
								type="email"
								placeholder="owner@abcretail.com"
								value={form.adminEmail}
								onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
								required
							/>
							<Input
								label="Password (min 8 chars)"
								type="password"
								placeholder="••••••••"
								value={form.adminPassword}
								onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
								required
							/>
						</div>
					</div>

					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting ? 'Creating Business...' : 'Create Business Workspace'}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
