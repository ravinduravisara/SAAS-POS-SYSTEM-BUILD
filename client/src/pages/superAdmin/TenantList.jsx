import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import superAdminService from '../../services/superAdminService'
import { formatDate } from '../../utils/formatDate'

export default function TenantList() {
	const [tenants, setTenants] = useState([])
	const [loading, setLoading] = useState(true)
	const [modalOpen, setModalOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState(null)
	const [currentStep, setCurrentStep] = useState(1)

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
		maxBranches: 2,
		maxProducts: 500,
	})

	useEffect(() => {
		let active = true
		superAdminService
			.getTenants()
			.then((data) => {
				if (active) {
					setTenants(data || [])
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
			setLoading(true)
			const data = await superAdminService.getTenants()
			setTenants(data || [])
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to refresh')
		} finally {
			setLoading(false)
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
			setCurrentStep(1)
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
				maxBranches: 2,
				maxProducts: 500,
			})
			await reloadTenants()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to create business')
		} finally {
			setSubmitting(false)
		}
	}

	const filteredTenants = useMemo(() => {
		return tenants.filter((t) => {
			const matchesStatus = statusFilter === 'all' || t.status === statusFilter
			const matchesSearch =
				!searchQuery ||
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(t.slug && t.slug.toLowerCase().includes(searchQuery.toLowerCase()))
			return matchesStatus && matchesSearch
		})
	}, [tenants, statusFilter, searchQuery])

	const columns = [
		{
			key: 'name',
			label: 'Business Name',
			render: (t) => (
				<div>
					<Link
						to={`/super-admin/tenants/${t.id}`}
						style={{ fontWeight: 600, color: 'var(--text)' }}
					>
						{t.name}
					</Link>
					<div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
						{t.email} {t.slug ? `· /${t.slug}` : ''}
					</div>
				</div>
			),
		},
		{
			key: 'industry',
			label: 'Industry / Preset',
			render: (t) => (
				<span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
					{t.business_type || 'Retail'}
				</span>
			),
		},
		{
			key: 'plan',
			label: 'Plan',
			render: (t) => (
				<span
					style={{
						padding: '2px 8px',
						borderRadius: '4px',
						fontSize: '0.75rem',
						fontWeight: 700,
						textTransform: 'uppercase',
						background: t.plan === 'enterprise' ? '#ede9fe' : '#e0f2fe',
						color: t.plan === 'enterprise' ? '#6d28d9' : '#0369a1',
					}}
				>
					{t.plan || 'Starter'}
				</span>
			),
		},
		{
			key: 'status',
			label: 'Status',
			render: (t) => <StatusBadge status={t.status || 'trial'} />,
		},
		{
			key: 'quotas',
			label: 'Limits (Users/Branches/Products)',
			render: (t) => (
				<span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
					{t.max_users || 2} users · {t.max_branches || 1} br · {t.max_products || 100} prods
				</span>
			),
		},
		{
			key: 'created_at',
			label: 'Created',
			render: (t) => (
				<span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
					{formatDate(t.created_at)}
				</span>
			),
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (t) => (
				<Link to={`/super-admin/tenants/${t.id}`} className="btn btn--secondary btn--sm">
					Manage →
				</Link>
			),
		},
	]

	return (
		<div>
			<PageHeader
				title="Tenants & Business Directory"
				subtitle="Manage registered business workspaces, subscription tiers, and module entitlements."
				actions={
					<Button
						variant="primary"
						onClick={() => {
							setCurrentStep(1)
							setError(null)
							setModalOpen(true)
						}}
					>
						+ Onboard Commercial Tenant
					</Button>
				}
			/>

			{error && (
				<div
					style={{
						padding: '12px 16px',
						background: 'var(--danger-light)',
						border: '1px solid #fecaca',
						color: 'var(--danger)',
						borderRadius: '8px',
						marginBottom: '16px',
						fontSize: '0.875rem',
					}}
				>
					{error}
				</div>
			)}

			{/* Status Filter Bar */}
			<div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
					<span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Filter:</span>
					{['all', 'active', 'trial', 'past_due', 'suspended', 'cancelled'].map((st) => (
						<button
							key={st}
							type="button"
							className={`btn btn--sm ${statusFilter === st ? 'btn--primary' : 'btn--secondary'}`}
							onClick={() => setStatusFilter(st)}
							style={{ textTransform: 'capitalize', borderRadius: '9999px' }}
						>
							{st.replace('_', ' ')}
						</button>
					))}
				</div>
			</div>

			<DataTable
				columns={columns}
				data={filteredTenants}
				loading={loading}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				searchPlaceholder="Search tenants by name, email, slug..."
				emptyTitle="No tenant businesses found"
				emptyDescription="There are no tenants matching your current search or status filter."
			/>

			{/* Multi-Step Onboarding Modal */}
			<Modal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				title={`Onboard Business (Step ${currentStep} of 4)`}
				maxWidth="640px"
			>
				{/* Step Progress Indicator */}
				<div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
					{['Company Profile', 'Store Admin', 'Plan & Preset', 'Review & Quotas'].map((label, idx) => (
						<div
							key={idx}
							style={{
								flex: '1 1 120px',
								paddingBottom: '6px',
								borderBottom: `3px solid ${currentStep === idx + 1 ? 'var(--primary)' : currentStep > idx + 1 ? 'var(--success)' : 'var(--border)'}`,
								fontSize: '0.75rem',
								fontWeight: currentStep === idx + 1 ? 700 : 500,
								color: currentStep === idx + 1 ? 'var(--primary)' : 'var(--muted)',
								textAlign: 'center',
							}}
						>
							{idx + 1}. {label}
						</div>
					))}
				</div>

				<form onSubmit={handleCreateTenant}>
					{/* STEP 1: Company Profile */}
					{currentStep === 1 && (
						<div className="stack" style={{ gap: '14px' }}>
							<div className="field">
								<label className="field__label">Legal Business Name *</label>
								<input
									type="text"
									className="input"
									required
									placeholder="e.g. Royal Palm Seafood Restaurant"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
								<div className="field">
									<label className="field__label">Industry Profile *</label>
									<select
										className="select"
										value={form.businessType}
										onChange={(e) => setForm({ ...form, businessType: e.target.value })}
									>
										<option value="retail">Retail Shop / Boutique</option>
										<option value="supermarket">Supermarket / Grocery</option>
										<option value="restaurant">Restaurant & Café</option>
										<option value="repairs">Service Center & Repairs</option>
										<option value="salon">Salon & Spa Aesthetics</option>
										<option value="pharmacy">Pharmacy & Healthcare</option>
									</select>
								</div>
								<div className="field">
									<label className="field__label">Business Reg. Number</label>
									<input
										type="text"
										className="input"
										placeholder="e.g. PV-12345"
										value={form.registrationNumber}
										onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
								<div className="field">
									<label className="field__label">Business Contact Email *</label>
									<input
										type="email"
										className="input"
										required
										placeholder="contact@royalpalm.com"
										value={form.email}
										onChange={(e) => setForm({ ...form, email: e.target.value })}
									/>
								</div>
								<div className="field">
									<label className="field__label">Phone Number</label>
									<input
										type="text"
										className="input"
										placeholder="+94 11 234 5678"
										value={form.phone}
										onChange={(e) => setForm({ ...form, phone: e.target.value })}
									/>
								</div>
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
								<Button
									variant="primary"
									disabled={!form.name || !form.email}
									onClick={() => setCurrentStep(2)}
								>
									Next: Owner Profile →
								</Button>
							</div>
						</div>
					)}

					{/* STEP 2: Owner Information */}
					{currentStep === 2 && (
						<div className="stack" style={{ gap: '14px' }}>
							<div className="field">
								<label className="field__label">Store Administrator Name *</label>
								<input
									type="text"
									className="input"
									required
									placeholder="e.g. Kasun Silva"
									value={form.adminName}
									onChange={(e) => setForm({ ...form, adminName: e.target.value })}
								/>
							</div>

							<div className="field">
								<label className="field__label">Admin Login Email *</label>
								<input
									type="email"
									className="input"
									required
									placeholder="admin@royalpalm.com"
									value={form.adminEmail}
									onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
								/>
							</div>

							<div className="field">
								<label className="field__label">Initial Secure Password (Min 8 chars) *</label>
								<input
									type="password"
									className="input"
									required
									placeholder="Choose an initial strong password"
									value={form.adminPassword}
									onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
								/>
							</div>

							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
								<Button variant="secondary" onClick={() => setCurrentStep(1)}>
									← Back
								</Button>
								<Button
									variant="primary"
									disabled={!form.adminName || !form.adminPassword || form.adminPassword.length < 8}
									onClick={() => setCurrentStep(3)}
								>
									Next: Plan & Preset →
								</Button>
							</div>
						</div>
					)}

					{/* STEP 3: Subscription Plan */}
					{currentStep === 3 && (
						<div className="stack" style={{ gap: '14px' }}>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
								{[
									{ id: 'starter', name: 'Starter', price: '$19/mo', desc: 'Single shop, basic POS' },
									{ id: 'pro', name: 'Professional', price: '$49/mo', desc: 'Purchases, multi-cashier' },
									{ id: 'enterprise', name: 'Enterprise', price: '$129/mo', desc: 'All ERP & Industry modules' },
								].map((tier) => (
									<div
										key={tier.id}
										onClick={() => setForm({ ...form, plan: tier.id })}
										style={{
											border: `2px solid ${form.plan === tier.id ? 'var(--primary)' : 'var(--border)'}`,
											borderRadius: '8px',
											padding: '12px',
											cursor: 'pointer',
											background: form.plan === tier.id ? 'var(--primary-light)' : '#ffffff',
										}}
									>
										<div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tier.name}</div>
										<div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
											{tier.price}
										</div>
										<div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tier.desc}</div>
									</div>
								))}
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
								<div className="field">
									<label className="field__label">Initial Account Status</label>
									<select
										className="select"
										value={form.status}
										onChange={(e) => setForm({ ...form, status: e.target.value })}
									>
										<option value="trial">Trial Window</option>
										<option value="active">Active (Paid)</option>
									</select>
								</div>
								<div className="field">
									<label className="field__label">Trial Period Duration (Days)</label>
									<input
										type="number"
										className="input"
										min="1"
										value={form.trialDays}
										onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })}
									/>
								</div>
							</div>

							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
								<Button variant="secondary" onClick={() => setCurrentStep(2)}>
									← Back
								</Button>
								<Button variant="primary" onClick={() => setCurrentStep(4)}>
									Next: Quotas & Review →
								</Button>
							</div>
						</div>
					)}

					{/* STEP 4: Resource Limits & Review */}
					{currentStep === 4 && (
						<div className="stack" style={{ gap: '14px' }}>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
								<div className="field">
									<label className="field__label">Max Users</label>
									<input
										type="number"
										className="input"
										min="1"
										value={form.maxUsers}
										onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })}
									/>
								</div>
								<div className="field">
									<label className="field__label">Max Branches</label>
									<input
										type="number"
										className="input"
										min="1"
										value={form.maxBranches}
										onChange={(e) => setForm({ ...form, maxBranches: Number(e.target.value) })}
									/>
								</div>
								<div className="field">
									<label className="field__label">Max Products</label>
									<input
										type="number"
										className="input"
										min="10"
										value={form.maxProducts}
										onChange={(e) => setForm({ ...form, maxProducts: Number(e.target.value) })}
									/>
								</div>
							</div>

							<div
								style={{
									padding: '14px',
									borderRadius: '8px',
									background: '#f8fafc',
									border: '1px solid #e2e8f0',
									fontSize: '0.85rem',
								}}
							>
								<div style={{ fontWeight: 700, marginBottom: '6px' }}>Onboarding Summary:</div>
								<div>Company: <strong>{form.name}</strong></div>
								<div>Industry: <strong style={{ textTransform: 'capitalize' }}>{form.businessType}</strong></div>
								<div>Plan: <strong style={{ textTransform: 'uppercase' }}>{form.plan}</strong> ({form.status})</div>
								<div>Owner: <strong>{form.adminName}</strong> ({form.adminEmail || form.email})</div>
							</div>

							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
								<Button variant="secondary" onClick={() => setCurrentStep(3)} disabled={submitting}>
									← Back
								</Button>
								<Button type="submit" variant="primary" loading={submitting}>
									Confirm & Provision Tenant
								</Button>
							</div>
						</div>
					)}
				</form>
			</Modal>
		</div>
	)
}
