function purchaseCreateValidator(req) {
	const { items } = req.body || {}
	if (!Array.isArray(items) || items.length === 0) return { error: 'Purchase items are required' }
	return { ok: true }
}

module.exports = { purchaseCreateValidator }
