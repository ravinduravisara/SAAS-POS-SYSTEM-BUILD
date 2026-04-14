import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
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
	const [creating, setCreating] = useState(false)
	const [createError, setCreateError] = useState(null)
	const [form, setForm] = useState({
		name: '',
		email: '',
		plan: 'starter',
		status: 'active',
		adminName: '',
		adminEmail: '',
		adminPassword: '',
	})

	function refresh() {
		superAdminService.getTenants().then(setTenants).catch(() => setTenants([]))
	}

	function onFormChange(key, value) {
		setForm((prev) => ({ ...prev, [key]: value }))
	}

	async function onCreateTenant(e) {
		e.preventDefault()
		setCreating(true)
		setCreateError(null)
		try {
			await superAdminService.createTenant({
				name: form.name,
				email: form.email,
				plan: form.plan,
				status: form.status,
				adminName: form.adminName,
				adminEmail: form.adminEmail,
				adminPassword: form.adminPassword,
			})
			setForm({
				name: '',
				email: '',
				plan: 'starter',
				status: 'active',
				adminName: '',
				adminEmail: '',
				adminPassword: '',
			})
			refresh()
		} catch (err) {
			setCreateError(err?.response?.data?.message || err?.message || 'Failed to create tenant')
		} finally {
			setCreating(false)
		}
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
			<form className="card stack" onSubmit={onCreateTenant}>
				<h3 className="h3">Create Tenant Company</h3>
				<div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
					<Input
						label="Company Name"
						value={form.name}
						onChange={(e) => onFormChange('name', e.target.value)}
						required
					/>
					<Input
						label="Company Email"
						type="email"
						value={form.email}
						onChange={(e) => onFormChange('email', e.target.value)}
						required
					/>
					<label className="field">
						<span className="field__label">Plan</span>
						<select className="input" value={form.plan} onChange={(e) => onFormChange('plan', e.target.value)}>
							<option value="starter">starter</option>
							<option value="pro">pro</option>
							<option value="enterprise">enterprise</option>
						</select>
					</label>
					<label className="field">
						<span className="field__label">Status</span>
						<select className="input" value={form.status} onChange={(e) => onFormChange('status', e.target.value)}>
							<option value="active">active</option>
							<option value="trial">trial</option>
						</select>
					</label>
					<Input
						label="Admin Name"
						value={form.adminName}
						onChange={(e) => onFormChange('adminName', e.target.value)}
						required
					/>
					<Input
						label="Admin Email"
						type="email"
						value={form.adminEmail}
						onChange={(e) => onFormChange('adminEmail', e.target.value)}
						required
					/>
					<Input
						label="Admin Password"
						type="password"
						value={form.adminPassword}
						onChange={(e) => onFormChange('adminPassword', e.target.value)}
						required
					/>
				</div>
				{createError ? <div className="error">{createError}</div> : null}
				<div className="row">
					<Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create tenant account'}</Button>
				</div>
			</form>

			<div className="row row--space">
				<div className="muted">Manage tenant plans and status.</div>
			</div>
			<Table columns={columns} rows={tenants} />
		</div>
	)
}