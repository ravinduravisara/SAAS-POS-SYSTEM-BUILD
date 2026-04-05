import { useEffect, useState } from 'react'
import superAdminService from '../../services/superAdminService'

export default function SuperAdminDashboard() {
	const [stats, setStats] = useState({ totalTenants: 0, active: 0, trial: 0, revenue: 0, signupsLast30Days: 0 })

	useEffect(() => {
		superAdminService.getStats().then(setStats).catch(() => {})
	}, [])

	return (
		<div className="grid">
			<div className="card"><h3 className="h3">Total Tenants</h3><div>{stats.totalTenants}</div></div>
			<div className="card"><h3 className="h3">Active Tenants</h3><div>{stats.active}</div></div>
			<div className="card"><h3 className="h3">Trial Accounts</h3><div>{stats.trial}</div></div>
			<div className="card"><h3 className="h3">MRR</h3><div>${Number(stats.monthlyRevenue ?? stats.revenue ?? 0).toFixed(2)}</div></div>
			<div className="card"><h3 className="h3">30 Day Signups</h3><div>{stats.signupsLast30Days}</div></div>
		</div>
	)
}