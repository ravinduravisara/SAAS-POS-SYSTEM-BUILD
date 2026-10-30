function customerCreateValidator(req) {
	const { name } = req.body || {}
	if (!name || typeof name !== 'string' || !name.trim()) {
		return { error: 'Customer name is required' }
	}
	return { ok: true }
}

module.exports = { customerCreateValidator }
