export default function DashboardHome() {
	return (
		<div className="grid">
			<div className="card">
				<h3 className="h3">Today</h3>
				<div className="muted">Sales, revenue, and activity summary.</div>
			</div>
			<div className="card">
				<h3 className="h3">Low Stock</h3>
				<div className="muted">Alerts will appear here.</div>
			</div>
			<div className="card">
				<h3 className="h3">Quick Actions</h3>
				<div className="muted">Open POS, add product, etc.</div>
			</div>
		</div>
	)
}
