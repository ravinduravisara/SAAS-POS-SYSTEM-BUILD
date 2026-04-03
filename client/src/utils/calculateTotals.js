export function calculateTotals(items = []) {
	const subtotal = items.reduce(
		(sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
		0,
	)
	const itemsCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
	const total = subtotal

	return { subtotal, total, itemsCount }
}
