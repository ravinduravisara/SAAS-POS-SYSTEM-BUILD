/**
 * Universal SaaS POS + ERP — Decimal-safe Monetary Calculation Engine
 * Uses minor currency units (cents/integer arithmetic) to prevent IEEE 754 floating point errors.
 */

function toCents(amount) {
	if (amount === undefined || amount === null || amount === '') return 0
	const num = Number(amount)
	if (!Number.isFinite(num)) return 0
	return Math.round(num * 100)
}

function fromCents(cents) {
	if (!Number.isFinite(cents)) return 0
	return Number((cents / 100).toFixed(2))
}

function add(a, b) {
	return fromCents(toCents(a) + toCents(b))
}

function subtract(a, b) {
	return fromCents(toCents(a) - toCents(b))
}

function multiply(a, factor) {
	const aCents = toCents(a)
	const f = Number(factor || 0)
	if (!Number.isFinite(f)) return 0
	return fromCents(Math.round(aCents * f))
}

function divide(a, divisor) {
	const d = Number(divisor || 0)
	if (!Number.isFinite(d) || d === 0) return 0
	return fromCents(Math.round(toCents(a) / d))
}

function round(amount, decimals = 2) {
	const factor = Math.pow(10, decimals)
	return Number((Math.round(Number(amount || 0) * factor) / factor).toFixed(decimals))
}

/**
 * Calculates tax on an amount.
 * @param {number} amount - Subtotal or base amount
 * @param {number} rate - Tax rate as fraction (e.g. 0.15 for 15%) or percentage (15)
 * @param {boolean} isInclusive - Whether the amount already includes tax
 */
function calculateTax(amount, rate = 0, isInclusive = false) {
	let r = Number(rate || 0)
	if (r > 1) {
		r = r / 100 // Convert percentage e.g. 15 to 0.15
	}
	if (r <= 0) return 0

	if (isInclusive) {
		// amount = base * (1 + r) => tax = amount - (amount / (1 + r))
		const amountCents = toCents(amount)
		const baseCents = Math.round(amountCents / (1 + r))
		return fromCents(amountCents - baseCents)
	}

	return multiply(amount, r)
}

/**
 * Calculates discount amount.
 * @param {number} amount - Base amount
 * @param {'percentage' | 'fixed'} type - Discount type
 * @param {number} value - Discount value (percentage 0-100 or fixed cash amount)
 */
function calculateDiscount(amount, type = 'fixed', value = 0) {
	const val = Number(value || 0)
	if (val <= 0) return 0
	if (type === 'percentage') {
		const clampedPercent = Math.min(100, Math.max(0, val))
		return multiply(amount, clampedPercent / 100)
	}
	return Math.min(amount, round(val, 2))
}

module.exports = {
	toCents,
	fromCents,
	add,
	subtract,
	multiply,
	divide,
	round,
	calculateTax,
	calculateDiscount,
}

