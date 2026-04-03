export function exportCSV(rows = [], filename = 'export.csv') {
	if (!rows.length) return
	const headers = Object.keys(rows[0])
	const csv = [headers.join(',')]
	for (const row of rows) {
		csv.push(headers.map((h) => JSON.stringify(row[h] ?? '')).join(','))
	}
	const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}
