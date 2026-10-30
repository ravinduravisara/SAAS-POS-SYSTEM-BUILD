import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import superAdminService from '../../services/superAdminService'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx'

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
					setStats(data || {})
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
		<div>
			<PageHeader
				title="SaaS Platform Control Center"
				subtitle="Global multi-tenant metrics, Monthly Recurring Revenue (MRR), and workspace growth."
				actions={
					<Link to="/super-admin/tenants" className="btn btn--primary">
						+ Onboard Commercial Tenant
					</Link>
				}
			/>

			{loading ? (
				<LoadingSkeleton type="card" count={6} />
			) : (
				<>
					{/* MRR & ARR Financial Metrics */}
					<div style={{ marginBottom: '24px' }}>
						<div
							style={{
								fontSize: '0.8125rem',
								fontWeight: 700,
								color: 'var(--muted)',
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
								marginBottom: '12px',
							}}
						>
							Subscription Run-Rate (SaaS Financials)
						</div>
						<div className="grid grid--3">
							<StatCard
								title="Monthly Recurring Revenue (MRR)"
								value={`$${Number(stats.monthlyRevenue || 0).toFixed(2)}`}
								sub="Real-time recurring monthly revenue"
								icon="💵"
								trend={{ value: 'Active MRR', isPositive: true }}
							/>
							<StatCard
								title="Annual Recurring Revenue (ARR)"
								value={`$${Number(stats.annualRevenue || 0).toFixed(2)}`}
								sub="Projected 12-month run rate"
								icon="📈"
								trend={{ value: 'Annualized', isPositive: true }}
							/>
							<StatCard
								title="Paying Subscriber Ratio"
								value={`${stats.active} / ${stats.totalTenants}`}
								sub={`${stats.totalTenants > 0 ? Math.round((stats.active / stats.totalTenants) * 100) : 0}% active paying conversion`}
								icon="👥"
							/>
						</div>
					</div>

					{/* Workspace Status Distribution */}
					<div style={{ marginBottom: '24px' }}>
						<div
							style={{
								fontSize: '0.8125rem',
								fontWeight: 700,
								color: 'var(--muted)',
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
								marginBottom: '12px',
							}}
						>
							Tenant Workspace Status
						</div>
						<div className="grid grid--4">
							<StatCard
								title="Total Registered Tenants"
								value={stats.totalTenants || 0}
								sub="All onboarded organizations"
								icon="🏢"
							/>
							<StatCard
								title="Active Commercial Workspaces"
								value={stats.active || 0}
								sub="Subscribers in good standing"
								icon="✅"
							/>
							<StatCard
								title="Active Trial Accounts"
								value={stats.trial || 0}
								sub="Prospective trial workspaces"
								icon="⏳"
							/>
							<StatCard
								title="Suspended / Expired"
								value={(stats.suspended || 0) + (stats.expired || 0)}
								sub="Blocked accounts requiring billing attention"
								icon="🛑"
							/>
						</div>
					</div>

					{/* Platform Usage Totals */}
					<div>
						<div
							style={{
								fontSize: '0.8125rem',
								fontWeight: 700,
								color: 'var(--muted)',
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
								marginBottom: '12px',
							}}
						>
							Platform Resource Volume
						</div>
						<div className="grid grid--3">
							<div className="card">
								<div style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Total User Logins</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{stats.totalUsers || 0}</div>
								<div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px' }}>Cashiers, managers, and tenant admins</div>
							</div>
							<div className="card">
								<div style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Total Catalog Products</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{stats.totalProducts || 0}</div>
								<div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px' }}>Active SKUs managed across all tenants</div>
							</div>
							<div className="card">
								<div style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Total Completed Transactions</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{stats.totalSales || 0}</div>
								<div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px' }}>Sales tickets processed through platform POS</div>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
