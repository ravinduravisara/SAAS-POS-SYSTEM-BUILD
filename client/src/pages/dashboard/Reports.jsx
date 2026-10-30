import { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
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

		setLoading(true)
		reportService
			.getSummary(params)
			.then((res) => {
				if (active) {
					setData(res || {})
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

	const totalPaymentVolume =
		(data.paymentBreakdown?.cash || 0) +
		(data.paymentBreakdown?.card || 0) +
		(data.paymentBreakdown?.bankTransfer || 0) +
		(data.paymentBreakdown?.split || 0) || 1

	return (
		<PlanGate feature="reports">
			<div className="stack">
				<PageHeader
					title="Financial Analytics & Reports"
					subtitle="Sales performance trends, operating profit margins, tax obligations, and product velocity."
					actions={
						<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
							<select
								className="input"
								value={range}
								onChange={(e) => setRange(e.target.value)}
								style={{ width: '140px', padding: '0.45rem 0.6rem' }}
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
					}
				/>

				{loading ? (
					<div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
						Calculating business financial metrics...
					</div>
				) : (
					<>
						{/* Top Financial KPI Metrics */}
						<div className="grid grid--4">
							<StatCard
								label="Total Sales Revenue"
								value={formatCurrency(data.revenue)}
								subtext={`${data.sales} completed transactions`}
								icon="💰"
							/>
							<StatCard
								label="Net Operating Profit"
								value={formatCurrency(data.netProfit)}
								subtext="Revenue minus recorded expenses"
								icon={data.netProfit >= 0 ? '📈' : '📉'}
							/>
							<StatCard
								label="Total Overhead Expenses"
								value={formatCurrency(data.expensesTotal)}
								subtext="Operating costs recorded"
								icon="🧾"
							/>
							<StatCard
								label="Sales Tax Collected"
								value={formatCurrency(data.taxTotal)}
								subtext="Liabilities payable"
								icon="🏛️"
							/>
						</div>

						{/* Payment Channel Breakdown & Top Products */}
						<div className="grid grid--2">
							{/* Payment Method Distribution */}
							<div className="card" style={{ padding: '1.25rem' }}>
								<div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1rem' }}>
									Revenue by Payment Channel
								</div>
								<div className="stack" style={{ gap: '1rem' }}>
									{[
										{ label: '💵 Cash Register', val: data.paymentBreakdown?.cash || 0, color: '#10b981' },
										{ label: '💳 Card Terminal', val: data.paymentBreakdown?.card || 0, color: '#4f46e5' },
										{ label: '🏦 Bank Transfer / QR', val: data.paymentBreakdown?.bankTransfer || 0, color: '#0284c7' },
										{ label: '⚡ Split Payment', val: data.paymentBreakdown?.split || 0, color: '#d97706' },
									].map((channel, idx) => {
										const pct = Math.round((channel.val / totalPaymentVolume) * 100)
										return (
											<div key={idx} className="stack" style={{ gap: '4px' }}>
												<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
													<span style={{ fontWeight: 500, color: '#334155' }}>{channel.label}</span>
													<span style={{ fontWeight: 600, color: '#0f172a' }}>
														{formatCurrency(channel.val)}{' '}
														<span style={{ color: '#64748b', fontWeight: 400 }}>({pct}%)</span>
													</span>
												</div>
												<div
													style={{
														height: '6px',
														backgroundColor: '#f1f5f9',
														borderRadius: '3px',
														overflow: 'hidden',
													}}
												>
													<div
														style={{
															width: `${pct}%`,
															height: '100%',
															backgroundColor: channel.color,
															borderRadius: '3px',
														}}
													/>
												</div>
											</div>
										)
									})}
								</div>
							</div>

							{/* Top Performing Products */}
							<div className="card" style={{ padding: '1.25rem' }}>
								<div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1rem' }}>
									Top Performing Products
								</div>
								{!data.topProducts || data.topProducts.length === 0 ? (
									<div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
										No product sales recorded in this period.
									</div>
								) : (
									<div className="stack" style={{ gap: '0.75rem' }}>
										{data.topProducts.map((p, idx) => (
											<div
												key={idx}
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													paddingBottom: '0.5rem',
													borderBottom: idx < data.topProducts.length - 1 ? '1px solid #f1f5f9' : 'none',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<span
														style={{
															width: '24px',
															height: '24px',
															borderRadius: '50%',
															backgroundColor: idx === 0 ? '#fef3c7' : '#f1f5f9',
															color: idx === 0 ? '#b45309' : '#64748b',
															fontWeight: 700,
															fontSize: '0.75rem',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													>
														#{idx + 1}
													</span>
													<div>
														<div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{p.name}</div>
														<div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.quantity} units sold</div>
													</div>
												</div>
												<div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.95rem' }}>
													{formatCurrency(p.revenue)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Daily Sales Trend History */}
						{data.dailyTrends && data.dailyTrends.length > 0 && (
							<div className="card" style={{ padding: '1.25rem' }}>
								<div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1rem' }}>
									Daily Revenue History
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
										gap: '10px',
									}}
								>
									{data.dailyTrends.map((d, i) => (
										<div
											key={i}
											style={{
												backgroundColor: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
												padding: '0.75rem',
												textAlign: 'center',
											}}
										>
											<div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.date}</div>
											<div style={{ fontWeight: 700, color: '#0f172a', marginTop: '4px', fontSize: '0.95rem' }}>
												{formatCurrency(d.revenue)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</PlanGate>
	)
}
