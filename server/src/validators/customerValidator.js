function customerCreateValidator(req) {
	const { name } = req.body || {}
	if (!name) return { error: 'Customer name is required' }
	return { ok: true }
}

module.exports = { customerCreateValidator }
