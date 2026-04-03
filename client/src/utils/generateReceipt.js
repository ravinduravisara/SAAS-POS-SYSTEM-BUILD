import { formatCurrency } from './formatCurrency'

export function generateReceipt({ items = [], totals }) {
	const lines = []
	lines.push('Receipt')
	lines.push('')
	for (const item of items) {
		lines.push(`${item.name} x${item.quantity} - ${formatCurrency(item.price)}`)
	}
	lines.push('')
	lines.push(`Total: ${formatCurrency(totals?.total ?? 0)}`)
	return lines.join('\n')
}
