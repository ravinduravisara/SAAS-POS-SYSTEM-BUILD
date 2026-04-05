
import { useEffect, useState } from 'react'
import api from '../../services/api'

export default function DashboardHome() {
	const [stats, setStats] = useState({ sales: 0, revenue: 0, lowStock: 0, customers: 0 })

	useEffect(() => {
		api.get('/dashboard/stats').then((res) => setStats(res.data)).catch(() => {})
	}, [])

	return (
		<div className="grid">
			<div className="card">
				<h3 className="h3">Today</h3>
				<div className="muted">Sales: {stats.sales}</div>
				<div className="muted">Revenue: {stats.revenue}</div>
			</div>
			<div className="card">
				<h3 className="h3">Low Stock</h3>
				<div className="muted">Items below threshold: {stats.lowStock}</div>
			</div>
			<div className="card">
				<h3 className="h3">Quick Actions</h3>
				<div className="muted">Customers: {stats.customers}</div>
			</div>
		</div>
	)
}
