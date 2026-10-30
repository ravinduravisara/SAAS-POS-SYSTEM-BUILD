function purchaseCreateValidator(req) {
	const { items } = req.body || {}
	if (!Array.isArray(items) || items.length === 0) {
		return { error: 'Purchase items must be a non-empty array' }
	}
	for (const item of items) {
		if (!item.productId) {
			return { error: 'Each purchase item must have a productId' }
		}
		const qty = Number(item.quantity)
		if (Number.isNaN(qty) || qty <= 0) {
			return { error: 'Each purchase item must have a positive quantity' }
		}
	}
	return { ok: true }
}

module.exports = { purchaseCreateValidator }
