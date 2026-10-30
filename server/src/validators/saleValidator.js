function saleCreateValidator(req) {
	const { items } = req.body || {}
	if (!Array.isArray(items) || items.length === 0) {
		return { error: 'Sale must contain at least one item' }
	}

	for (const item of items) {
		if (!item.productId) {
			return { error: 'Each item must have a valid productId' }
		}
		const qty = Number(item.quantity)
		if (Number.isNaN(qty) || qty <= 0) {
			return { error: 'Each item must have a positive quantity' }
		}
	}

	return { ok: true }
}

module.exports = { saleCreateValidator }
