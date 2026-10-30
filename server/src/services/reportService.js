const { getSupabase } = require('../config/db')
const { round, add, subtract } = require('../../../shared/utils/decimal')

async function summary(tenantId, filters = {}) {
	const db = getSupabase()

	let query = db
		.from('sales')
		.select('*, sale_items(*)')
		.eq('tenant_id', tenantId)

	if (filters.status) {
		query = query.eq('status', filters.status)
	}

	const { data: allSales, error: salesError } = await query
	if (salesError) throw salesError

	// Date filtering
	let sales = allSales || []
	if (filters.startDate) {
		const start = new Date(filters.startDate).getTime()
		sales = sales.filter((s) => new Date(s.created_at).getTime() >= start)
	}
	if (filters.endDate) {
		const end = new Date(filters.endDate).getTime()
		sales = sales.filter((s) => new Date(s.created_at).getTime() <= end)
	}

	// Expenses query for Net Profit calculation
	const { data: allExpenses } = await db.from('expenses').select('*').eq('tenant_id', tenantId)
	let expenses = allExpenses || []
	if (filters.startDate) {
		const start = new Date(filters.startDate).getTime()
		expenses = expenses.filter((e) => new Date(e.created_at).getTime() >= start)
	}
	if (filters.endDate) {
		const end = new Date(filters.endDate).getTime()
		expenses = expenses.filter((e) => new Date(e.created_at).getTime() <= end)
	}

	let totalRevenue = 0
	let totalSubtotal = 0
	let totalDiscount = 0
	let totalTax = 0
	let totalItemsCount = 0

	const paymentBreakdown = { cash: 0, card: 0, bank_transfer: 0, split: 0, other: 0 }
	const productMap = new Map()
	const dailyBuckets = new Map()

	for (const sale of sales) {
		if (sale.status === 'refunded' || sale.status === 'voided') continue

		const saleTotal = Number(sale.total || 0)
		totalRevenue = add(totalRevenue, saleTotal)
		totalSubtotal = add(totalSubtotal, Number(sale.subtotal || 0))
		totalDiscount = add(totalDiscount, Number(sale.discount_total || 0))
		totalTax = add(totalTax, Number(sale.tax_total || 0))
		totalItemsCount += Number(sale.items_count || 0)

		// Payment breakdown
		const method = String(sale.payment_method || 'other').toLowerCase()
		if (paymentBreakdown[method] !== undefined) {
			paymentBreakdown[method] = add(paymentBreakdown[method], saleTotal)
		} else {
			paymentBreakdown.other = add(paymentBreakdown.other, saleTotal)
		}

		// Daily trend
		const dayKey = new Date(sale.created_at).toISOString().slice(0, 10)
		dailyBuckets.set(dayKey, add(dailyBuckets.get(dayKey) || 0, saleTotal))

		// Item ranking
		for (const item of sale.sale_items || []) {
			const pid = item.product_id || item.name
			const existing = productMap.get(pid) || { name: item.name, quantity: 0, revenue: 0 }
			existing.quantity += Number(item.quantity || 0)
			existing.revenue = add(existing.revenue, Number(item.total_amount || item.price * item.quantity || 0))
			productMap.set(pid, existing)
		}
	}

	const topProducts = [...productMap.entries()]
		.map(([productId, val]) => ({
			productId,
			name: val.name,
			quantity: val.quantity,
			revenue: round(val.revenue, 2),
		}))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, 5)

	const dailyTrends = [...dailyBuckets.entries()]
		.map(([date, revenue]) => ({ date, revenue: round(revenue, 2) }))
		.sort((a, b) => a.date.localeCompare(b.date))

	const totalExpenses = expenses.reduce((sum, e) => add(sum, Number(e.amount || 0)), 0)
	const estimatedNetProfit = subtract(totalRevenue, totalExpenses)

	return {
		revenue: round(totalRevenue, 2),
		sales: sales.filter((s) => s.status !== 'refunded').length,
		subtotal: round(totalSubtotal, 2),
		discountTotal: round(totalDiscount, 2),
		taxTotal: round(totalTax, 2),
		itemsSold: totalItemsCount,
		expensesTotal: round(totalExpenses, 2),
		netProfit: round(estimatedNetProfit, 2),
		paymentBreakdown: {
			cash: round(paymentBreakdown.cash, 2),
			card: round(paymentBreakdown.card, 2),
			bankTransfer: round(paymentBreakdown.bank_transfer, 2),
			split: round(paymentBreakdown.split, 2),
		},
		dailyTrends,
		topProducts,
	}
}

async function exportCsv(tenantId, filters = {}) {
	const db = getSupabase()
	const { data: sales } = await db
		.from('sales')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })

	const rows = [
		['Sale ID', 'Date', 'Customer', 'Status', 'Payment Method', 'Subtotal', 'Discount', 'Tax', 'Total'],
	]

	for (const s of sales || []) {
		rows.push([
			s.id,
			new Date(s.created_at).toISOString(),
			s.customer_name || 'Walk-in',
			s.status || 'completed',
			s.payment_method || 'cash',
			Number(s.subtotal || 0).toFixed(2),
			Number(s.discount_total || 0).toFixed(2),
			Number(s.tax_total || 0).toFixed(2),
			Number(s.total || 0).toFixed(2),
		])
	}

	return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

module.exports = { summary, exportCsv }
