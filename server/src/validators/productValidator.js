function productCreateValidator(req) {
	const { name, price } = req.body || {}
	if (!name) return { error: 'Product name is required' }
	if (price === undefined || Number.isNaN(Number(price))) return { error: 'Valid price is required' }
	return { ok: true }
}

module.exports = { productCreateValidator }
