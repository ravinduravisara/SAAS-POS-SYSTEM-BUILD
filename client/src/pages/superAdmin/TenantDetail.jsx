import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Table from '../../components/common/Table.jsx'
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
		]).then(([tenantData, catalogData]) => {
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
		}).catch((err) => {
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

	if (!tenant) {
		return <div className="card muted">Loading workspace configuration...</div>
	}

	const userColumns = [
		{ header: 'Name', key: 'name' },
		{ header: 'Email', key: 'email' },
		{ header: 'Role', key: 'role' },
		{ header: 'Created', key: 'createdAt', render: (r) => formatDate(r.createdAt) },
	]

	// Group features by category
	const featuresByCategory = {}
	for (const feat of catalog.features || []) {
		const cat = feat.category || 'General'
		if (!featuresByCategory[cat]) featuresByCategory[cat] = []
		featuresByCategory[cat].push(feat)
	}

	return (
		<div className="stack">
			<div className="row row--space">
				<div>
					<div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
						<Link to="/super-admin/tenants" style={{ textDecoration: 'none', color: '#64748b' }}>
							← Back to Directory
						</Link>
					</div>
					<h2 className="h2" style={{ margin: '0.25rem 0' }}>{tenant.name}</h2>
					<div className="muted">ID: {tenant.id} | Slug: {tenant.slug} | Type: {tenant.businessType || 'Retail'}</div>
				</div>
				<div className="row" style={{ gap: '0.5rem' }}>
					<span
						style={{
							padding: '6px 14px',
							borderRadius: '20px',
							fontSize: '0.85rem',
							fontWeight: 'bold',
							textTransform: 'uppercase',
							backgroundColor: tenant.status === 'active' ? '#dcfce7' : '#fef3c7',
							color: tenant.status === 'active' ? '#166534' : '#92400e',
						}}
					>
						{tenant.status}
					</span>
				</div>
			</div>

			{message ? <div className="card" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>{message}</div> : null}
			{error ? <div className="card error">{error}</div> : null}

			{/* Status, Plan & Limits Controls */}
			<div className="card stack">
				<h3 className="h3" style={{ margin: 0 }}>Workspace Subscription & Limits</h3>
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

				<div className="grid grid--2">
					<div>
						<label className="label">Max Product Limit (-1 for unlimited)</label>
						<Input
							type="number"
							value={limits.maxProducts}
							onChange={(e) => setLimits({ ...limits, maxProducts: parseInt(e.target.value, 10) || 1 })}
						/>
					</div>
					<div>
						<label className="label">Max Location/Branches</label>
						<Input
							type="number"
							value={limits.maxBranches}
							onChange={(e) => setLimits({ ...limits, maxBranches: parseInt(e.target.value, 10) || 1 })}
						/>
					</div>
				</div>

				<div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
					<Button onClick={handleSaveStatusPlan} disabled={saving}>
						{saving ? 'Updating...' : 'Save Subscription & Limits'}
					</Button>
				</div>
			</div>

			{/* Industry Preset Quick Application */}
			<div className="card stack">
				<h3 className="h3" style={{ margin: 0 }}>Industry-Specific Feature Presets</h3>
				<div className="muted">Quickly configure recommended modules for this business model:</div>
				<div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
					{Object.entries(catalog.presets || {}).map(([presetKey, p]) => (
						<Button
							key={presetKey}
							variant="secondary"
							onClick={() => handleApplyPreset(presetKey)}
							disabled={saving}
							style={{ fontSize: '0.85rem' }}
						>
							{p.name}
						</Button>
					))}
				</div>
			</div>

			{/* Categorized Feature Registry Toggles */}
			<div className="card stack">
				<div className="row row--space">
					<div>
						<h3 className="h3" style={{ margin: 0 }}>Feature Activation Engine</h3>
						<div className="muted">Granular database-driven module toggles without code changes.</div>
					</div>
					<Button onClick={handleSaveFeatures} disabled={saving}>
						{saving ? 'Saving Features...' : 'Save Module Configuration'}
					</Button>
				</div>

				{Object.entries(featuresByCategory).map(([categoryName, feats]) => (
					<div key={categoryName} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
						<h4 className="h4" style={{ margin: '0 0 0.5rem 0', color: '#0f766e' }}>{categoryName}</h4>
						<div className="grid grid--2" style={{ gap: '0.75rem' }}>
							{feats.map((feat) => {
								const enabled = Boolean(featureValues[feat.key])
								return (
									<div
										key={feat.key}
										style={{
											border: '1px solid #e2e8f0',
											borderRadius: '6px',
											padding: '0.75rem',
											backgroundColor: enabled ? '#f0fdf4' : '#fafafa',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<div>
											<div className="bold">{feat.name}</div>
											<div className="muted" style={{ fontSize: '0.75rem' }}>{feat.key}</div>
											<div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#475569' }}>
												{feat.description}
											</div>
											{feat.dependencies && feat.dependencies.length > 0 ? (
												<div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: '0.2rem' }}>
													Requires: {feat.dependencies.join(', ')}
												</div>
											) : null}
										</div>
										<button
											type="button"
											className={`button button--${enabled ? 'primary' : 'secondary'}`}
											style={{
												minWidth: '70px',
												backgroundColor: enabled ? '#166534' : '#e2e8f0',
												color: enabled ? '#fff' : '#475569',
												fontSize: '0.8rem',
											}}
											onClick={() => toggleFeature(feat.key)}
										>
											{enabled ? 'ON' : 'OFF'}
										</button>
									</div>
								)
							})}
						</div>
					</div>
				))}

				<div className="row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
					<Button onClick={handleSaveFeatures} disabled={saving}>
						{saving ? 'Saving Features...' : 'Save Module Configuration'}
					</Button>
				</div>
			</div>

			{/* Users in Workspace */}
			<div className="card stack">
				<h3 className="h3" style={{ margin: 0 }}>Registered Employees ({tenant.users?.length || 0})</h3>
				<Table columns={userColumns} data={tenant.users || []} />
			</div>
		</div>
	)
}
