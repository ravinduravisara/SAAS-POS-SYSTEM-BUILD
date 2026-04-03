export function formatDate(date) {
	const d = date instanceof Date ? date : new Date(date)
	if (Number.isNaN(d.getTime())) return ''
	return d.toLocaleString()
}
