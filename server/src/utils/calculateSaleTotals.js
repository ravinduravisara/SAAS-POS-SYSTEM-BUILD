const {
	add,
	subtract,
	multiply,
	round,
	calculateTax,
	calculateDiscount,
	toCents,
	fromCents,
} = require('../../../shared/utils/decimal')

/**
 * Authoritatively calculates sale totals, line items, taxes, and discounts on the backend.
 * Never trust frontend totals!
 */
function calculateSaleTotals({
	items = [],
	discount = null,
	taxRate = 0,
	taxInclusive = false,
}) {
	let subtotal = 0
	let totalItemDiscounts = 0
	let totalTax = 0
	let totalUnits = 0

	const calculatedItems = items.map((item) => {
		const quantity = Math.max(1, parseInt(item.quantity, 10) || 1)
		const unitPrice = Math.max(0, round(item.price || item.unitPrice || 0, 2))
		const grossLineAmount = multiply(unitPrice, quantity)

		// Item level discount
		let itemDiscount = 0
		if (item.discountType && item.discountValue) {
			itemDiscount = calculateDiscount(grossLineAmount, item.discountType, item.discountValue)
		} else if (item.discountAmount) {
			itemDiscount = Math.min(grossLineAmount, round(item.discountAmount, 2))
		}

		const netLineAmount = Math.max(0, subtract(grossLineAmount, itemDiscount))

		// Item level tax or tenant default tax rate
		const itemTaxRate = item.taxRate !== undefined && item.taxRate !== null ? Number(item.taxRate) : Number(taxRate || 0)
		const itemTax = calculateTax(netLineAmount, itemTaxRate, taxInclusive)

		const lineTotal = taxInclusive ? netLineAmount : add(netLineAmount, itemTax)

		subtotal = add(subtotal, grossLineAmount)
		totalItemDiscounts = add(totalItemDiscounts, itemDiscount)
		totalTax = add(totalTax, itemTax)
		totalUnits += quantity

		return {
			productId: item.productId,
			variantId: item.variantId || null,
			name: String(item.name || 'Item').trim(),
			sku: item.sku || null,
			price: unitPrice,
			quantity,
			grossAmount: grossLineAmount,
			discountAmount: itemDiscount,
			netAmount: netLineAmount,
			taxRate: itemTaxRate,
			taxAmount: itemTax,
			totalAmount: lineTotal,
		}
	})

	// Order level discount
	let orderDiscount = 0
	const orderBase = subtract(subtotal, totalItemDiscounts)
	if (discount && discount.value) {
		orderDiscount = calculateDiscount(orderBase, discount.type || 'fixed', discount.value)
	} else if (discount && typeof discount === 'number') {
		orderDiscount = Math.min(orderBase, round(discount, 2))
	}

	const totalDiscount = add(totalItemDiscounts, orderDiscount)
	const taxableBase = Math.max(0, subtract(subtotal, totalDiscount))

	// If taxes were calculated at line item level, adjust for order discount proportionally or re-aggregate
	let finalTax = totalTax
	if (orderDiscount > 0 && totalTax > 0 && !taxInclusive) {
		// Re-calculate proportional tax on discounted taxable base if taxRate is constant
		const effectiveTaxRate = Number(taxRate || 0)
		if (effectiveTaxRate > 0) {
			finalTax = calculateTax(taxableBase, effectiveTaxRate, false)
		}
	}

	const grandTotal = taxInclusive
		? taxableBase
		: add(taxableBase, finalTax)

	return {
		items: calculatedItems,
		totals: {
			subtotal: round(subtotal, 2),
			discountTotal: round(totalDiscount, 2),
			taxTotal: round(finalTax, 2),
			total: round(grandTotal, 2),
			itemsCount: totalUnits,
		},
	}
}

module.exports = { calculateSaleTotals }

