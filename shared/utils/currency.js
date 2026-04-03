function formatCurrency(value, currency = 'LKR') {
	const numberValue = Number(value || 0)
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(numberValue)
}

module.exports = { formatCurrency }
