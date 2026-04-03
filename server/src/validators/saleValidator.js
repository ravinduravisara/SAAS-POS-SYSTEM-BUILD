function saleCreateValidator(req) {
	const { items } = req.body || {}
	if (!Array.isArray(items) || items.length === 0) return { error: 'Sale items are required' }
	return { ok: true }
}

module.exports = { saleCreateValidator }
