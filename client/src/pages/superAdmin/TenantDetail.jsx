import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import superAdminService from '../../services/superAdminService'
import { formatDate } from '../../utils/formatDate'

export default function TenantDetail() {
	const { id } = useParams()
	const [tenant, setTenant] = useState(null)
	const [catalog, setCatalog] = useState({ categories: {}, features: [], presets: {} })
	const [featureValues, setFeatureValues] = useState({})
	const [status, setStatus] = useState('trial')
	const [plan, setPlan] = useState('pro')
	const [limits, setLimits] = useState({ maxUsers: 5, maxProducts: 500, maxBranches: 1 })
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState(null)
	const [error, setError] = useState(null)

	useEffect(() => {
		let active = true
		Promise.all([
			superAdminService.getTenant(id),
			superAdminService.getFeatures().catch(() => ({ categories: {}, features: [], presets: {} })),
		])
			.then(([tenantData, catalogData]) => {
				if (active) {
					setTenant(tenantData)
					setCatalog(catalogData)
					setStatus(tenantData.status || 'trial')
					setPlan(tenantData.plan || 'pro')
					setLimits({
						maxUsers: tenantData.maxUsers ?? 5,
						maxProducts: tenantData.maxProducts ?? 500,
						maxBranches: tenantData.maxBranches ?? 1,
					})
					setFeatureValues(tenantData.planFeatures || {})
				}
			})
			.catch((err) => {
				if (active) setError(err?.response?.data?.message || err?.message || 'Failed to load details')
			})
		return () => {
			active = false
		}
	}, [id])

	async function reload() {
		const data = await superAdminService.getTenant(id)
		setTenant(data)
		setStatus(data.status || 'trial')
		setPlan(data.plan || 'pro')
		setLimits({
			maxUsers: data.maxUsers ?? 5,
			maxProducts: data.maxProducts ?? 500,
			maxBranches: data.maxBranches ?? 1,
		})
		setFeatureValues(data.planFeatures || {})
	}

	async function handleSaveStatusPlan() {
		setSaving(true)
		setMessage(null)
		setError(null)
		try {
			if (status !== tenant.status) {
				await superAdminService.updateStatus(id, status)
			}
			if (plan !== tenant.plan) {
				await superAdminService.updatePlan(id, plan)
			}
			await superAdminService.updateLimits(id, limits)
			setMessage('Status, plan and limits updated successfully')
			setTimeout(() => setMessage(null), 3500)
			await reload()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Update failed')
		} finally {
			setSaving(false)
		}
	}

	async function handleApplyPreset(presetKey) {
		setSaving(true)
		setMessage(null)
		setError(null)
		try {
			const res = await superAdminService.updateTenantFeatures(id, {}, presetKey)
			setTenant(res)
			setFeatureValues(res.planFeatures || {})
			setMessage(`Applied preset '${catalog.presets[presetKey]?.name || presetKey}' successfully`)
			setTimeout(() => setMessage(null), 3500)
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to apply preset')
		} finally {
			setSaving(false)
		}
	}

	async function handleSaveFeatures() {
		setSaving(true)
		setMessage(null)
		setError(null)
		try {
			const res = await superAdminService.updateTenantFeatures(id, featureValues)
			setTenant(res)
			setFeatureValues(res.planFeatures || {})
			if (res.dependencyWarnings && res.dependencyWarnings.length > 0) {
				setError(`Warning: ${res.dependencyWarnings.join('; ')}`)
			} else {
				setMessage('Feature entitlements saved successfully')
				setTimeout(() => setMessage(null), 3500)
			}
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to update features')
		} finally {
			setSaving(false)
		}
	}

	function toggleFeature(key) {
		setFeatureValues((prev) => ({
			...prev,
			[key]: !prev[key],
		}))
	}

	const userColumns = useMemo(
		() => [
			{
				label: 'Staff Member',
				key: 'name',
				render: (row) => (
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<div
							style={{
								width: '30px',
								height: '30px',
								borderRadius: '50%',
								backgroundColor: '#e0e7ff',
								color: '#4338ca',
								fontWeight: 700,
								fontSize: '0.8rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{row.name ? row.name.charAt(0).toUpperCase() : 'U'}
						</div>
						<span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
					</div>
				),
			},
			{ label: 'Email', key: 'email' },
			{
				label: 'Role',
				key: 'role',
				render: (row) => (
					<StatusBadge
						status={row.role === 'admin' ? 'primary' : 'info'}
						label={row.role}
					/>
				),
			},
			{
				label: 'Registered Date',
				key: 'createdAt',
				render: (r) => (
					<span style={{ fontSize: '0.85rem', color: '#64748b' }}>
						{formatDate(r.createdAt)}
					</span>
				),
			},
		],
		[],
	)

	if (!tenant) {
		return (
			<div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
				Loading workspace configuration...
			</div>
		)
	}

	// Group features by category
	const featuresByCategory = {}
	for (const feat of catalog.features || []) {
		const cat = feat.category || 'General'
		if (!featuresByCategory[cat]) featuresByCategory[cat] = []
		featuresByCategory[cat].push(feat)
	}

	return (
		<div className="stack">
			<div style={{ marginBottom: '8px' }}>
				<Link to="/super-admin/tenants" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem' }}>
					← Back to Tenants Directory
				</Link>
			</div>

			<PageHeader
				title={tenant.name}
				subtitle={`Workspace ID: ${tenant.id} · Domain Slug: ${tenant.slug} · Business Model: ${tenant.businessType || 'Retail'}`}
				actions={
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<StatusBadge
							status={
								tenant.status === 'active'
									? 'success'
									: tenant.status === 'trial'
									? 'warning'
									: 'danger'
							}
							label={tenant.status}
						/>
						<span
							style={{
								padding: '4px 10px',
								borderRadius: '9999px',
								fontSize: '0.75rem',
								fontWeight: 700,
								textTransform: 'uppercase',
								backgroundColor: '#e0e7ff',
								color: '#4338ca',
							}}
						>
							{tenant.plan || 'starter'}
						</span>
					</div>
				}
			/>

			{message && (
				<div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
					{message}
				</div>
			)}
			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}

			{/* Status, Plan & Limits Controls */}
			<div className="card" style={{ padding: '1.5rem' }}>
				<h3 className="h3" style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>
					Workspace Subscription & Quota Limits
				</h3>
				<div className="grid grid--3">
					<div>
						<label className="label">Lifecycle Status</label>
						<select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
							<option value="trial">TRIAL (Free evaluation access)</option>
							<option value="active">ACTIVE (Fully authorized paid access)</option>
							<option value="past_due">PAST_DUE (Payment grace period)</option>
							<option value="suspended">SUSPENDED (Operational writes blocked)</option>
							<option value="cancelled">CANCELLED (Contract terminated)</option>
							<option value="expired">EXPIRED (Subscription ended)</option>
							<option value="archived">ARCHIVED (Read-only data preservation)</option>
						</select>
					</div>
					<div>
						<label className="label">Plan Tier</label>
						<select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
							<option value="starter">Starter Plan ($9.99/mo)</option>
							<option value="pro">Pro Plan ($29.99/mo)</option>
							<option value="enterprise">Enterprise Plan ($99.99/mo)</option>
						</select>
					</div>
					<div>
						<label className="label">Max User Limit</label>
						<Input
							type="number"
							value={limits.maxUsers}
							onChange={(e) => setLimits({ ...limits, maxUsers: parseInt(e.target.value, 10) || 1 })}
						/>
					</div>
				</div>

				<div className="grid grid--2" style={{ marginTop: '1rem' }}>
					<div>
						<label className="label">Max Catalog Products (-1 for unlimited)</label>
						<Input
							type="number"
							value={limits.maxProducts}
							onChange={(e) => setLimits({ ...limits, maxProducts: parseInt(e.target.value, 10) || 1 })}
						/>
					</div>
					<div>
						<label className="label">Max Locations / Branches</label>
						<Input
							type="number"
							value={limits.maxBranches}
							onChange={(e) => setLimits({ ...limits, maxBranches: parseInt(e.target.value, 10) || 1 })}
						/>
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
					<Button onClick={handleSaveStatusPlan} disabled={saving}>
						{saving ? 'Updating Quotas...' : 'Save Subscription & Limits'}
					</Button>
				</div>
			</div>

			{/* Industry Preset Quick Application */}
			<div className="card" style={{ padding: '1.5rem' }}>
				<h3 className="h3" style={{ margin: 0, color: '#0f172a' }}>
					Industry-Specific Feature Presets
				</h3>
				<p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 1rem 0' }}>
					Instantly activate bundled modules tailored for this tenant&apos;s business vertical:
				</p>
				<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
					{Object.entries(catalog.presets || {}).map(([presetKey, p]) => (
						<Button
							key={presetKey}
							variant="secondary"
							onClick={() => handleApplyPreset(presetKey)}
							disabled={saving}
							size="sm"
						>
							⚡ Apply {p.name}
						</Button>
					))}
				</div>
			</div>

			{/* Categorized Feature Registry Toggles */}
			<div className="card" style={{ padding: '1.5rem' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
					<div>
						<h3 className="h3" style={{ margin: 0, color: '#0f172a' }}>
							Feature Activation Engine
						</h3>
						<div style={{ fontSize: '0.85rem', color: '#64748b' }}>
							Granular database-driven module toggles without code deployment.
						</div>
					</div>
					<Button onClick={handleSaveFeatures} disabled={saving}>
						{saving ? 'Saving Features...' : 'Save Module Configuration'}
					</Button>
				</div>

				<div className="stack" style={{ gap: '1.25rem' }}>
					{Object.entries(featuresByCategory).map(([categoryName, feats]) => (
						<div key={categoryName} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
							<h4 style={{ margin: '0 0 0.75rem 0', color: '#4f46e5', fontSize: '0.95rem', fontWeight: 700 }}>
								{categoryName} Modules
							</h4>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
									gap: '10px',
								}}
							>
								{feats.map((feat) => {
									const enabled = Boolean(featureValues[feat.key])
									return (
										<div
											key={feat.key}
											style={{
												border: `1px solid ${enabled ? '#bbf7d0' : '#e2e8f0'}`,
												borderRadius: '8px',
												padding: '12px',
												backgroundColor: enabled ? '#f0fdf4' : '#ffffff',
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												gap: '8px',
												transition: 'all 140ms ease',
											}}
										>
											<div style={{ minWidth: 0, flex: 1 }}>
												<div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
													{feat.name}
												</div>
												<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
													{feat.key}
												</div>
												{feat.dependencies && feat.dependencies.length > 0 && (
													<div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: '2px' }}>
														Requires: {feat.dependencies.join(', ')}
													</div>
												)}
											</div>
											<Button
												variant={enabled ? 'primary' : 'secondary'}
												size="sm"
												style={{
													minWidth: '55px',
													backgroundColor: enabled ? '#16a34a' : '',
													borderColor: enabled ? '#16a34a' : '',
												}}
												onClick={() => toggleFeature(feat.key)}
											>
												{enabled ? 'ON' : 'OFF'}
											</Button>
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
					<Button onClick={handleSaveFeatures} disabled={saving}>
						{saving ? 'Saving Features...' : 'Save Module Configuration'}
					</Button>
				</div>
			</div>

			{/* Users in Workspace */}
			<div className="card" style={{ padding: '1.25rem' }}>
				<div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1rem' }}>
					Registered Workspace Users ({tenant.users?.length || 0})
				</div>
				<DataTable
					columns={userColumns}
					data={tenant.users || []}
					emptyTitle="No staff users found"
					emptyDescription="No users have been registered under this tenant."
				/>
			</div>
		</div>
	)
}
