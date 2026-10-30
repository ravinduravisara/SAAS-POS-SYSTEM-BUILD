import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import superAdminService from '../../services/superAdminService'
import Button from '../../components/common/Button.jsx'

export default function SuperAdminDashboard() {
	const [stats, setStats] = useState({
		totalTenants: 0,
		active: 0,
		trial: 0,
		suspended: 0,
		expired: 0,
		monthlyRevenue: 0,
		annualRevenue: 0,
		totalUsers: 0,
		totalProducts: 0,
		totalSales: 0,
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true
		superAdminService
			.getStats()
			.then((data) => {
				if (active) {
					setStats(data)
					setLoading(false)
				}
			})
			.catch(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [])

	return (
		<div className="stack">
			<div className="row row--space">
				<div>
					<h2 className="h2" style={{ margin: 0 }}>Platform Control Center</h2>
					<div className="muted">Universal multi-tenant SaaS oversight, subscription metrics, and growth.</div>
				</div>
				<Link to="/super-admin/tenants">
					<Button>+ Onboard New Business</Button>
				</Link>
			</div>

			{loading ? (
				<div className="card muted">Loading platform analytics...</div>
			) : (
				<>
					{/* Financial Performance */}
					<h3 className="h3" style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>Recurring Revenue (SaaS Metrics)</h3>
					<div className="grid grid--3">
						<div className="card" style={{ borderLeft: '4px solid #0f766e' }}>
							<div className="muted">Monthly Recurring Revenue (MRR)</div>
							<div className="bold" style={{ fontSize: '1.8rem', color: '#0f766e', marginTop: '0.25rem' }}>
								${Number(stats.monthlyRevenue || 0).toFixed(2)}
							</div>
							<div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
								Calculated from active subscriptions
							</div>
						</div>
						<div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
							<div className="muted">Annual Recurring Revenue (ARR)</div>
							<div className="bold" style={{ fontSize: '1.8rem', color: '#0284c7', marginTop: '0.25rem' }}>
								${Number(stats.annualRevenue || 0).toFixed(2)}
							</div>
							<div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
								Projected 12-month run rate
							</div>
						</div>
						<div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
							<div className="muted">Paying Subscribers</div>
							<div className="bold" style={{ fontSize: '1.8rem', color: '#8b5cf6', marginTop: '0.25rem' }}>
								{stats.active} / {stats.totalTenants}
							</div>
							<div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
								{stats.totalTenants > 0 ? Math.round((stats.active / stats.totalTenants) * 100) : 0}% paying conversion
							</div>
						</div>
					</div>

					{/* Business Tenant Distribution */}
					<h3 className="h3" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>Tenant Status Breakdown</h3>
					<div className="grid grid--4">
						<div className="card">
							<div className="muted">Total Registered</div>
							<div className="bold" style={{ fontSize: '1.4rem' }}>{stats.totalTenants}</div>
						</div>
						<div className="card">
							<div className="muted">Active Workspaces</div>
							<div className="bold" style={{ fontSize: '1.4rem', color: '#166534' }}>{stats.active}</div>
						</div>
						<div className="card">
							<div className="muted">Trial Accounts</div>
							<div className="bold" style={{ fontSize: '1.4rem', color: '#d97706' }}>{stats.trial}</div>
						</div>
						<div className="card">
							<div className="muted">Suspended / Expired</div>
							<div className="bold" style={{ fontSize: '1.4rem', color: '#dc2626' }}>
								{Number(stats.suspended || 0) + Number(stats.expired || 0)}
							</div>
						</div>
					</div>

					{/* Platform Scale Metrics */}
					<h3 className="h3" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>Platform Utilization</h3>
					<div className="grid grid--3">
						<div className="card">
							<div className="muted">Total Employee Users</div>
							<div className="bold" style={{ fontSize: '1.4rem' }}>{stats.totalUsers}</div>
							<div className="muted" style={{ fontSize: '0.8rem' }}>Across all business tenants</div>
						</div>
						<div className="card">
							<div className="muted">Cataloged Products</div>
							<div className="bold" style={{ fontSize: '1.4rem' }}>{stats.totalProducts}</div>
							<div className="muted" style={{ fontSize: '0.8rem' }}>Total items in tenant databases</div>
						</div>
						<div className="card">
							<div className="muted">Transactions Processed</div>
							<div className="bold" style={{ fontSize: '1.4rem' }}>{stats.totalSales}</div>
							<div className="muted" style={{ fontSize: '0.8rem' }}>Historical sales completed</div>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
