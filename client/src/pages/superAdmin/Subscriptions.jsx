import { useEffect, useState, useMemo, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import superAdminService from '../../services/superAdminService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function Subscriptions() {
	const [subscriptions, setSubscriptions] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [editingSub, setEditingSub] = useState(null)
	const [editPlan, setEditPlan] = useState('pro')
	const [editStatus, setEditStatus] = useState('active')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	const refresh = useCallback(async () => {
		try {
			setLoading(true)
			setError('')
			const data = await superAdminService.getSubscriptions()
			setSubscriptions(data || [])
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to load subscriptions')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		refresh()
	}, [refresh])

	const stats = useMemo(() => {
		const total = subscriptions.length
		const active = subscriptions.filter((s) => s.status === 'active').length
		const trial = subscriptions.filter((s) => s.status === 'trial').length
		const mrr = subscriptions
			.filter((s) => s.status === 'active')
			.reduce((sum, s) => sum + Number(s.amount || (s.plan === 'enterprise' ? 99.99 : s.plan === 'pro' ? 29.99 : 9.99)), 0)
		return { total, active, trial, mrr }
	}, [subscriptions])

	const filteredSubs = useMemo(() => {
		if (!searchQuery.trim()) return subscriptions
		const q = searchQuery.toLowerCase()
		return subscriptions.filter(
			(s) =>
				(s.tenant?.name && s.tenant.name.toLowerCase().includes(q)) ||
				(s.tenantId && s.tenantId.toLowerCase().includes(q)) ||
				(s.plan && s.plan.toLowerCase().includes(q)) ||
				(s.status && s.status.toLowerCase().includes(q)),
		)
	}, [subscriptions, searchQuery])

	const handleOpenEdit = (sub) => {
		setEditingSub(sub)
		setEditPlan(sub.plan || 'pro')
		setEditStatus(sub.status || 'active')
	}

	const handleSaveEdit = async (e) => {
		e.preventDefault()
		if (!editingSub) return
		setSaving(true)
		try {
			await superAdminService.updateSubscription(editingSub.id, {
				plan: editPlan,
				status: editStatus,
			})
			setEditingSub(null)
			await refresh()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to update subscription')
		} finally {
			setSaving(false)
		}
	}

	const columns = useMemo(
		() => [
			{
				label: 'Organization / Tenant',
				key: 'tenant',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>
							{row.tenant?.name || row.tenantId}
						</div>
						{row.tenant?.email && (
							<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
								{row.tenant.email}
							</div>
						)}
					</div>
				),
			},
			{
				label: 'Subscription Plan',
				key: 'plan',
				render: (row) => {
					const plan = row.plan || 'starter'
					return (
						<span
							style={{
								padding: '3px 8px',
								borderRadius: '9999px',
								fontSize: '0.75rem',
								fontWeight: 700,
								textTransform: 'uppercase',
								backgroundColor:
									plan === 'enterprise' ? '#ede9fe' : plan === 'pro' ? '#e0f2fe' : '#f1f5f9',
								color:
									plan === 'enterprise' ? '#6d28d9' : plan === 'pro' ? '#0369a1' : '#475569',
							}}
						>
							{plan}
						</span>
					)
				},
			},
			{
				label: 'Status',
				key: 'status',
				render: (row) => (
					<StatusBadge
						status={
							row.status === 'active'
								? 'success'
								: row.status === 'trial'
								? 'warning'
								: 'danger'
						}
						label={row.status}
					/>
				),
			},
			{
				label: 'Recurring Amount',
				key: 'amount',
				render: (row) => (
					<span style={{ fontWeight: 600, color: '#0f172a' }}>
						{formatCurrency(Number(row.amount || 0))}
					</span>
				),
			},
			{
				label: 'Started At',
				key: 'startedAt',
				render: (row) => (
					<span style={{ fontSize: '0.85rem', color: '#64748b' }}>
						{row.startedAt ? formatDate(row.startedAt) : '—'}
					</span>
				),
			},
			{
				label: 'Next Renewal',
				key: 'renewsAt',
				render: (row) => (
					<span style={{ fontSize: '0.85rem', color: '#64748b' }}>
						{row.renewsAt ? formatDate(row.renewsAt) : '—'}
					</span>
				),
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '120px',
				render: (row) => (
					<Button
						variant="secondary"
						size="sm"
						onClick={() => handleOpenEdit(row)}
					>
						Modify Plan
					</Button>
				),
			},
		],
		[],
	)

	return (
		<div className="stack">
			<PageHeader
				title="Commercial Subscriptions & Billing"
				subtitle="Manage multi-tenant SaaS subscription contracts, active recurring revenues, and plan tiers."
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}

			{/* KPI Summary Cards */}
			<div className="grid grid--4">
				<StatCard
					title="Active Subscriptions"
					value={stats.active}
					sub="Commercial paid accounts"
					icon="💳"
				/>
				<StatCard
					title="Monthly Recurring Run-Rate"
					value={`$${stats.mrr.toFixed(2)}`}
					sub="Real-time monthly revenue"
					icon="💵"
				/>
				<StatCard
					title="Trial Workspaces"
					value={stats.trial}
					sub="Evaluating prospects"
					icon="⏳"
				/>
				<StatCard
					title="Total Contracts"
					value={stats.total}
					sub="All recorded subscriptions"
					icon="📑"
				/>
			</div>

			{/* Subscriptions DataTable */}
			<div className="card" style={{ padding: '1.25rem' }}>
				<DataTable
					columns={columns}
					data={filteredSubs}
					loading={loading}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search subscription by tenant name, plan, or status..."
					emptyTitle="No subscriptions found"
					emptyDescription="No subscription contracts match your search."
				/>
			</div>

			{/* Modify Subscription Modal */}
			<Modal
				title={`Modify Subscription: ${editingSub?.tenant?.name || editingSub?.tenantId || ''}`}
				open={Boolean(editingSub)}
				onClose={() => setEditingSub(null)}
			>
				<form onSubmit={handleSaveEdit} className="stack">
					<div>
						<label className="label">Plan Tier</label>
						<select
							className="input"
							value={editPlan}
							onChange={(e) => setEditPlan(e.target.value)}
						>
							<option value="starter">Starter Plan ($9.99/mo)</option>
							<option value="pro">Pro Plan ($29.99/mo)</option>
							<option value="enterprise">Enterprise Plan ($99.99/mo)</option>
						</select>
					</div>

					<div>
						<label className="label">Subscription Lifecycle Status</label>
						<select
							className="input"
							value={editStatus}
							onChange={(e) => setEditStatus(e.target.value)}
						>
							<option value="active">Active (Good standing)</option>
							<option value="trial">Trial (Evaluation period)</option>
							<option value="past_due">Past Due (Payment retry)</option>
							<option value="cancelled">Cancelled (Terminated)</option>
							<option value="expired">Expired (Needs renewal)</option>
						</select>
					</div>

					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setEditingSub(null)} disabled={saving}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? 'Updating...' : 'Save Subscription Changes'}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
