function calculateTax(amount, rate = 0) {
	const a = Number(amount || 0)
	const r = Number(rate || 0)
	return a * r
}

module.exports = { calculateTax }
