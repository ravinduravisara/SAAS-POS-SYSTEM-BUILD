import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Table from '../../components/common/Table.jsx'
import superAdminService from '../../services/superAdminService'

export default function TenantDetail() {
	const { id } = useParams()
	const [tenant, setTenant] = useState(null)
	const [featureValues, setFeatureValues] = useState({})
	const [savingFeatures, setSavingFeatures] = useState(false)
	const [featureMessage, setFeatureMessage] = useState(null)

	useEffect(() => {
		superAdminService.getTenant(id).then(setTenant).catch(() => setTenant(null))
	}, [id])

	useEffect(() => {
		if (!tenant) return
		const toggles = Object.entries(tenant.planFeatures || {}).reduce((acc, [key, value]) => {
			if (typeof value === 'boolean') acc[key] = value
			return acc
		}, {})
		setFeatureValues(toggles)
	}, [tenant])

	async function saveFeatures() {
		setSavingFeatures(true)
		setFeatureMessage(null)
		try {
			const updated = await superAdminService.updateTenantFeatures(id, featureValues)
			setTenant(updated)
			setFeatureMessage('Feature settings updated')
		} catch (err) {
			setFeatureMessage(err?.response?.data?.message || err?.message || 'Failed to update features')
		} finally {
			setSavingFeatures(false)
		}
	}

	function toggleFeature(key) {
		setFeatureValues((prev) => ({ ...prev, [key]: !prev[key] }))
	}

	if (!tenant) {
		return <div className="card">Loading tenant...</div>
	}

	return (
		<div className="stack">
			<div className="card stack">
				<h3 className="h3">{tenant.name}</h3>
				<div>Email: {tenant.email}</div>
				<div>Plan: {tenant.plan}</div>
				<div>Status: {tenant.status}</div>
				<div>Created: {tenant.createdAt}</div>
			</div>
			<div className="grid">
				<div className="card">Users: {tenant.usage?.userCount || 0}</div>
				<div className="card">Products: {tenant.usage?.productCount || 0}</div>
				<div className="card">Sales: {tenant.usage?.saleCount || 0}</div>
				<div className="card">Customers: {tenant.usage?.customerCount || 0}</div>
			</div>
			<div className="card stack">
				<h3 className="h3">Subscription</h3>
				<div>Plan: {tenant.subscription?.plan || 'n/a'}</div>
				<div>Status: {tenant.subscription?.status || 'n/a'}</div>
				<div>Amount: {tenant.subscription?.amount || 0}</div>
			</div>
			<div className="card stack">
				<h3 className="h3">Tenant Features</h3>
				<div className="muted">Super admin can override plan-level modules for this tenant.</div>
				<div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
					{Object.entries(featureValues).map(([key, value]) => (
						<div key={key} className="field" style={{ marginBottom: 0 }}>
							<span className="field__label" style={{ textTransform: 'capitalize' }}>{key}</span>
							<div className="row" style={{ gap: '0.5rem' }}>
								<input type="checkbox" checked={Boolean(value)} onChange={() => toggleFeature(key)} />
								<span>{value ? 'Enabled' : 'Disabled'}</span>
							</div>
						</div>
					))}
				</div>
				<div className="row">
					<Button onClick={saveFeatures} disabled={savingFeatures}>{savingFeatures ? 'Saving...' : 'Save feature settings'}</Button>
				</div>
				{featureMessage ? <div className="muted">{featureMessage}</div> : null}
			</div>
			<div className="card stack">
				<h3 className="h3">Users</h3>
				<Table
					columns={[
						{ header: 'Name', key: 'name' },
						{ header: 'Email', key: 'email' },
						{ header: 'Role', key: 'role' },
					]}
					rows={tenant.users || []}
				/>
			</div>
		</div>
	)
}