import { useEffect, useState } from 'react'
import PlanGate from '../../components/common/PlanGate.jsx'
import Button from '../../components/common/Button.jsx'
import reportService from '../../services/reportService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function Reports() {
	const [data, setData] = useState({
		revenue: 0,
		sales: 0,
		subtotal: 0,
		discountTotal: 0,
		taxTotal: 0,
		itemsSold: 0,
		expensesTotal: 0,
		netProfit: 0,
		paymentBreakdown: { cash: 0, card: 0, bankTransfer: 0, split: 0 },
		dailyTrends: [],
		topProducts: [],
	})
	const [range, setRange] = useState('all')
	const [loading, setLoading] = useState(true)
	const [exporting, setExporting] = useState(false)

	useEffect(() => {
		let active = true
		const params = {}
		const now = new Date()

		if (range === 'today') {
			params.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
		} else if (range === 'week') {
			const d = new Date()
			d.setDate(d.getDate() - 7)
			params.startDate = d.toISOString()
		} else if (range === 'month') {
			params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
		}

		reportService
			.getSummary(params)
			.then((res) => {
				if (active) {
					setData(res)
					setLoading(false)
				}
			})
			.catch(() => {
				if (active) setLoading(false)
			})

		return () => {
			active = false
		}
	}, [range])

	async function handleExport() {
		setExporting(true)
		try {
			await reportService.exportCsv()
		} finally {
			setExporting(false)
		}
	}

	return (
		<PlanGate feature="reports">
			<div className="stack">
				<div className="row row--space">
					<div>
						<h2 className="h2" style={{ margin: 0 }}>Business Analytics & Financial Reports</h2>
						<div className="muted">Sales trends, operating profitability, and product velocity.</div>
					</div>
					<div className="row" style={{ gap: '0.5rem' }}>
						<select
							className="input"
							value={range}
							onChange={(e) => setRange(e.target.value)}
							style={{ width: '150px' }}
						>
							<option value="all">All Time</option>
							<option value="today">Today</option>
							<option value="week">Last 7 Days</option>
							<option value="month">This Month</option>
						</select>
						<Button variant="secondary" onClick={handleExport} disabled={exporting}>
							{exporting ? 'Exporting...' : '📥 Export CSV'}
						</Button>
					</div>
				</div>

				{loading ? (
					<div className="card muted">Calculating financial aggregates...</div>
				) : (
					<>
						{/* Top Financial KPI Metrics */}
						<div className="grid grid--4">
							<div className="card" style={{ borderLeft: '4px solid #0f766e' }}>
								<div className="muted">Total Sales Revenue</div>
								<div className="bold" style={{ fontSize: '1.6rem', color: '#0f766e' }}>
									{formatCurrency(data.revenue)}
								</div>
								<div className="muted" style={{ fontSize: '0.8rem' }}>{data.sales} completed transactions</div>
							</div>
							<div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
								<div className="muted">Net Operating Profit</div>
								<div className="bold" style={{ fontSize: '1.6rem', color: data.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
									{formatCurrency(data.netProfit)}
								</div>
								<div className="muted" style={{ fontSize: '0.8rem' }}>Revenue minus recorded expenses</div>
							</div>
							<div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
								<div className="muted">Total Expenses</div>
								<div className="bold" style={{ fontSize: '1.6rem', color: '#dc2626' }}>
									{formatCurrency(data.expensesTotal)}
								</div>
								<div className="muted" style={{ fontSize: '0.8rem' }}>Operating overheads recorded</div>
							</div>
							<div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
								<div className="muted">Taxes Collected</div>
								<div className="bold" style={{ fontSize: '1.6rem', color: '#2563eb' }}>
									{formatCurrency(data.taxTotal)}
								</div>
								<div className="muted" style={{ fontSize: '0.8rem' }}>Cumulative sales tax liabilities</div>
							</div>
						</div>

						{/* Payment Channel Breakdown & Top Products */}
						<div className="grid grid--2">
							<div className="card stack">
								<h3 className="h3" style={{ margin: 0 }}>Sales by Payment Channel</h3>
								<div className="stack" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
									<div className="row row--space">
										<span>💵 Cash</span>
										<strong>{formatCurrency(data.paymentBreakdown?.cash || 0)}</strong>
									</div>
									<div className="row row--space">
										<span>💳 Card Terminal</span>
										<strong>{formatCurrency(data.paymentBreakdown?.card || 0)}</strong>
									</div>
									<div className="row row--space">
										<span>🏦 Bank Transfer / QR</span>
										<strong>{formatCurrency(data.paymentBreakdown?.bankTransfer || 0)}</strong>
									</div>
									<div className="row row--space">
										<span>⚡ Split Payment</span>
										<strong>{formatCurrency(data.paymentBreakdown?.split || 0)}</strong>
									</div>
								</div>
							</div>

							<div className="card stack">
								<h3 className="h3" style={{ margin: 0 }}>Top Selling Products</h3>
								{data.topProducts?.length === 0 ? (
									<div className="muted">No sales items recorded yet.</div>
								) : (
									<div className="stack" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
										{data.topProducts.map((p, idx) => (
											<div key={idx} className="row row--space" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
												<div>
													<span className="bold">{p.name}</span>
													<span className="muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
														({p.quantity} units)
													</span>
												</div>
												<strong style={{ color: '#0f766e' }}>{formatCurrency(p.revenue)}</strong>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Daily Sales Velocity Trend */}
						{data.dailyTrends?.length > 0 ? (
							<div className="card stack">
								<h3 className="h3" style={{ margin: 0 }}>Daily Revenue History</h3>
								<div className="grid grid--4" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
									{data.dailyTrends.map((d, i) => (
										<div key={i} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
											<div className="muted" style={{ fontSize: '0.8rem' }}>{d.date}</div>
											<div className="bold" style={{ color: '#0f766e', marginTop: '0.2rem' }}>
												{formatCurrency(d.revenue)}
											</div>
										</div>
									))}
								</div>
							</div>
						) : null}
					</>
				)}
			</div>
		</PlanGate>
	)
}
