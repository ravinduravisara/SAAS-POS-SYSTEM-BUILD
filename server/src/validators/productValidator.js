function productCreateValidator(req) {
	const { name, price } = req.body || {}
	if (!name || typeof name !== 'string' || !name.trim()) {
		return { error: 'Product name is required' }
	}
	const parsedPrice = Number(price)
	if (price === undefined || Number.isNaN(parsedPrice) || parsedPrice < 0) {
		return { error: 'Valid non-negative price is required' }
	}
	return { ok: true }
}

module.exports = { productCreateValidator }
