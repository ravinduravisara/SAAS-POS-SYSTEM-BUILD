function formatResponse(data, meta) {
	if (meta) return { data, meta }
	return data
}

module.exports = formatResponse
