function generateReceiptText(sale) {
	const lines = []
	lines.push('Receipt')
	lines.push(`Sale: ${sale.id}`)
	lines.push(`Date: ${sale.createdAt}`)
	lines.push('')
	for (const item of sale.items || []) {
		lines.push(`${item.name} x${item.quantity} @ ${item.price}`)
	}
	lines.push('')
	lines.push(`Total: ${sale.totals?.total || 0}`)
	return lines.join('\n')
}

module.exports = { generateReceiptText }
