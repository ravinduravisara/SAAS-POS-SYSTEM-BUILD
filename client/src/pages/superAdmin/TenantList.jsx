import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Table from '../../components/common/Table.jsx'
import superAdminService from '../../services/superAdminService'

function TenantRow({ tenant, onRefresh }) {
	const [plan, setPlan] = useState(tenant.plan || 'starter')
	const [status, setStatus] = useState(tenant.status || 'active')
	const [busy, setBusy] = useState(false)

	async function save() {
		setBusy(true)
		try {
			await superAdminService.updatePlan(tenant.id, plan)
			await superAdminService.updateStatus(tenant.id, status)
			onRefresh()
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
			<select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
				<option value="starter">starter</option>
				<option value="pro">pro</option>
				<option value="enterprise">enterprise</option>
			</select>
			<select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
				<option value="active">active</option>
				<option value="suspended">suspended</option>
				<option value="trial">trial</option>
				<option value="cancelled">cancelled</option>
			</select>
			<Button variant="secondary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
			<Link to={`/super-admin/tenants/${tenant.id}`}>View</Link>
		</div>
	)
}

export default function TenantList() {
	const [tenants, setTenants] = useState([])

	function refresh() {
		superAdminService.getTenants().then(setTenants).catch(() => setTenants([]))
	}

	useEffect(() => {
		refresh()
	}, [])

	const columns = [
		{ header: 'Tenant', key: 'name' },
		{ header: 'Email', key: 'email' },
		{ header: 'Plan', key: 'plan' },
		{ header: 'Status', key: 'status' },
		{ header: 'Created', key: 'createdAt' },
		{ header: 'Actions', key: 'actions', render: (row) => <TenantRow tenant={row} onRefresh={refresh} /> },
	]

	return (
		<div className="stack">
			<div className="row row--space">
				<div className="muted">Manage tenant plans and status.</div>
			</div>
			<Table columns={columns} rows={tenants} />
		</div>
	)
}