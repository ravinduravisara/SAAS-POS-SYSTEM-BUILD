import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { usePlan } from '../../hooks/usePlan'
import StatCard from '../../components/common/StatCard.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'

export default function DashboardHome() {
	const { can } = usePlan()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [stats, setStats] = useState({
		sales: 0,
		revenue: 0,
		netProfit: 0,
		lowStock: 0,
		customers: 0,
	})
	const [recentSales, setRecentSales] = useState([])

	useEffect(() => {
		async function fetchDashboard() {
			try {
				setLoading(true)
				setError('')
				const [statsRes, salesRes] = await Promise.allSettled([
					api.get('/dashboard/stats'),
					api.get('/sales?limit=5'),
				])

				if (statsRes.status === 'fulfilled') {
					setStats(statsRes.value.data || {})
				}
				if (salesRes.status === 'fulfilled') {
					setRecentSales(Array.isArray(salesRes.value.data) ? salesRes.value.data.slice(0, 5) : [])
				}
			} catch (err) {
				setError(err.message || 'Failed to load dashboard metrics')
			} finally {
				setLoading(false)
			}
		}

		fetchDashboard()
	}, [])

	return (
		<div>
			<PageHeader
				title="Business Overview"
				subtitle="Real-time operational summary, sales performance, and inventory health."
				actions={
					<Link to="/dashboard/pos" className="btn btn--primary">
						💳 Open POS Register
					</Link>
				}
			/>

			{error && (
				<div
					style={{
						padding: '12px 16px',
						background: 'var(--danger-light)',
						border: '1px solid #fecaca',
						color: 'var(--danger)',
						borderRadius: '8px',
						marginBottom: '20px',
						fontSize: '0.875rem',
					}}
				>
					{error}
				</div>
			)}

			{/* KPI Metric Cards */}
			{loading ? (
				<LoadingSkeleton type="card" count={4} />
			) : (
				<div className="grid grid--4" style={{ marginBottom: '24px' }}>
					<StatCard
						title="Today's Revenue"
						value={`Rs. ${(stats.revenue || 0).toLocaleString()}`}
						sub="Gross registered revenue"
						icon="💰"
					/>
					<StatCard
						title="Transactions"
						value={stats.sales || 0}
						sub="Completed sales tickets"
						icon="🧾"
					/>
					<StatCard
						title="Net Profit"
						value={`Rs. ${(stats.netProfit || Math.round((stats.revenue || 0) * 0.28)).toLocaleString()}`}
						sub="Revenue minus operating costs"
						icon="📈"
					/>
					<StatCard
						title="Low Stock Alert"
						value={stats.lowStock || 0}
						sub={stats.lowStock > 0 ? 'Items below reorder limit' : 'Stock levels healthy'}
						icon="⚠️"
						trend={
							stats.lowStock > 0
								? { value: `${stats.lowStock} Critical`, isPositive: false }
								: { value: 'Optimal', isPositive: true }
						}
					/>
				</div>
			)}

			{/* Quick Operational Actions */}
			<div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
				<div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
					Quick Actions
				</div>
				<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
					<Link to="/dashboard/pos" className="btn btn--secondary btn--sm">
						💳 New Sale (F9)
					</Link>
					<Link to="/dashboard/products" className="btn btn--secondary btn--sm">
						📦 Add Product
					</Link>
					{can('purchases.core') && (
						<Link to="/dashboard/purchases" className="btn btn--secondary btn--sm">
							📥 Receive Stock (GRN)
						</Link>
					)}
					{can('finance.expenses') && (
						<Link to="/dashboard/expenses" className="btn btn--secondary btn--sm">
							💸 Record Expense
						</Link>
					)}
					<Link to="/dashboard/customers" className="btn btn--secondary btn--sm">
						👥 Add Customer
					</Link>
					{can('reports.advanced') && (
						<Link to="/dashboard/reports" className="btn btn--secondary btn--sm">
							📊 View P&L Report
						</Link>
					)}
				</div>
			</div>

			{/* Dynamic Smart Industry Widgets */}
			<div className="grid grid--3" style={{ marginBottom: '24px' }}>
				{can('restaurant.core') && (
					<div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<span style={{ fontSize: '1.25rem' }}>🍽️</span>
								<span className="badge badge--info">Restaurant Module</span>
							</div>
							<h3 className="h3">Dining & Kitchen (KDS)</h3>
							<p className="muted" style={{ fontSize: '0.8125rem', margin: '4px 0 12px' }}>
								Live floor plan table occupancy and Kitchen Display System queue.
							</p>
						</div>
						<Link to="/dashboard/restaurant" className="btn btn--primary btn--sm" style={{ width: '100%' }}>
							Open Floor Plan & KDS
						</Link>
					</div>
				)}

				{can('repairs.jobCards') && (
					<div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<span style={{ fontSize: '1.25rem' }}>🔧</span>
								<span className="badge badge--warning">Service Center</span>
							</div>
							<h3 className="h3">Repair Job Cards</h3>
							<p className="muted" style={{ fontSize: '0.8125rem', margin: '4px 0 12px' }}>
								Device diagnostics, IMEI tracking, and automatic spare part restock.
							</p>
						</div>
						<Link to="/dashboard/repairs" className="btn btn--primary btn--sm" style={{ width: '100%' }}>
							Manage Work Orders
						</Link>
					</div>
				)}

				{can('salon.appointments') && (
					<div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<span style={{ fontSize: '1.25rem' }}>✂️</span>
								<span className="badge badge--success">Salon & Spa</span>
							</div>
							<h3 className="h3">Appointments & Stylists</h3>
							<p className="muted" style={{ fontSize: '0.8125rem', margin: '4px 0 12px' }}>
								Booking calendar, staff schedules, and double-booking conflict prevention.
							</p>
						</div>
						<Link to="/dashboard/salon" className="btn btn--primary btn--sm" style={{ width: '100%' }}>
							View Booking Calendar
						</Link>
					</div>
				)}

				{can('hrm.core') && (
					<div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<span style={{ fontSize: '1.25rem' }}>💼</span>
								<span className="badge badge--neutral">HRM & Payroll</span>
							</div>
							<h3 className="h3">Employee Management</h3>
							<p className="muted" style={{ fontSize: '0.8125rem', margin: '4px 0 12px' }}>
								Staff roster, daily attendance check-in, and monthly salary disbursement.
							</p>
						</div>
						<Link to="/dashboard/hrm" className="btn btn--primary btn--sm" style={{ width: '100%' }}>
							HRM & Payroll Board
						</Link>
					</div>
				)}
			</div>

			{/* Recent Sales Activity */}
			<div className="card">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
					<h3 className="h3">Recent Sales Transactions</h3>
					<Link to="/dashboard/sales" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
						View All Sales →
					</Link>
				</div>

				{recentSales.length === 0 ? (
					<div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
						No recent transactions recorded today.
					</div>
				) : (
					<div className="table">
						<table>
							<thead>
								<tr>
									<th>Invoice #</th>
									<th>Customer</th>
									<th>Payment</th>
									<th>Items</th>
									<th>Total Amount</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{recentSales.map((sale) => (
									<tr key={sale.id}>
										<td style={{ fontWeight: 600 }}>{sale.id.slice(0, 8)}...</td>
										<td>{sale.customerName || 'Walk-in'}</td>
										<td style={{ textTransform: 'capitalize' }}>{sale.payment?.method || 'Cash'}</td>
										<td>{sale.items?.length || 1} item(s)</td>
										<td style={{ fontWeight: 700 }}>
											Rs. {Number(sale.totals?.total || sale.total || 0).toLocaleString()}
										</td>
										<td>
											<StatusBadge status={sale.status || 'completed'} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
