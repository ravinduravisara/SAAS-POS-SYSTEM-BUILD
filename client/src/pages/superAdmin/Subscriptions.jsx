import { useEffect, useState } from 'react'
import Table from '../../components/common/Table.jsx'
import Button from '../../components/common/Button.jsx'
import superAdminService from '../../services/superAdminService'

function SubscriptionRow({ subscription, onRefresh }) {
	const [plan, setPlan] = useState(subscription.plan || 'starter')
	const [status, setStatus] = useState(subscription.status || 'active')
	const [busy, setBusy] = useState(false)

	async function save() {
		setBusy(true)
		try {
			await superAdminService.updateSubscription(subscription.id, { plan, status })
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
				<option value="trial">trial</option>
				<option value="cancelled">cancelled</option>
			</select>
			<Button variant="secondary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
		</div>
	)
}

export default function Subscriptions() {
	const [subscriptions, setSubscriptions] = useState([])

	function refresh() {
		superAdminService.getSubscriptions().then(setSubscriptions).catch(() => setSubscriptions([]))
	}

	useEffect(() => {
		refresh()
	}, [])

	const columns = [
		{ header: 'Tenant', key: 'tenant', render: (row) => row.tenant?.name || row.tenantId },
		{ header: 'Plan', key: 'plan' },
		{ header: 'Status', key: 'status' },
		{ header: 'Amount', key: 'amount' },
		{ header: 'Started', key: 'startedAt' },
		{ header: 'Renews', key: 'renewsAt' },
		{ header: 'Actions', key: 'actions', render: (row) => <SubscriptionRow subscription={row} onRefresh={refresh} /> },
	]

	return <Table columns={columns} rows={subscriptions} />
}