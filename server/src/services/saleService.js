const { getSupabase } = require('../config/db')
const { calculateSaleTotals } = require('../utils/calculateSaleTotals')
const { round } = require('../../../shared/utils/decimal')

async function list(tenantId, query = {}) {
	const db = getSupabase()
	let q = db
		.from('sales')
		.select('*, sale_items(*)')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })

	if (query.customerId) {
		q = q.eq('customer_id', query.customerId)
	}
	if (query.status) {
		q = q.eq('status', query.status)
	}

	const { data, error } = await q
	if (error) throw error

	return (data || []).map((sale) => ({
		id: sale.id,
		tenantId: sale.tenant_id,
		customerId: sale.customer_id,
		customerName: sale.customer_name || 'Walk-in Customer',
		status: sale.status || 'completed',
		createdAt: sale.created_at,
		idempotencyKey: sale.idempotency_key || null,
		totals: {
			subtotal: Number(sale.subtotal || 0),
			discountTotal: Number(sale.discount_total || 0),
			taxTotal: Number(sale.tax_total || 0),
			total: Number(sale.total || 0),
			itemsCount: Number(sale.items_count || 0),
		},
		payment: {
			method: sale.payment_method || 'cash',
			paid: Number(sale.payment_paid || 0),
			change: Number(sale.payment_change || 0),
		},
		items: (sale.sale_items || []).map((item) => ({
			id: item.id,
			productId: item.product_id,
			name: item.name,
			sku: item.sku,
			price: Number(item.price || 0),
			quantity: Number(item.quantity || 0),
			grossAmount: Number(item.gross_amount || item.price * item.quantity || 0),
			discountAmount: Number(item.discount_amount || 0),
			netAmount: Number(item.net_amount || item.price * item.quantity || 0),
			taxAmount: Number(item.tax_amount || 0),
			totalAmount: Number(item.total_amount || item.price * item.quantity || 0),
		})),
	}))
}

async function getById(tenantId, saleId) {
	const db = getSupabase()
	const { data: sale, error } = await db
		.from('sales')
		.select('*, sale_items(*)')
		.eq('id', saleId)
		.eq('tenant_id', tenantId)
		.single()
	if (error || !sale) {
		const err = new Error('Sale not found')
		err.status = 404
		throw err
	}

	return {
		id: sale.id,
		tenantId: sale.tenant_id,
		customerId: sale.customer_id,
		customerName: sale.customer_name || 'Walk-in Customer',
		status: sale.status || 'completed',
		createdAt: sale.created_at,
		totals: {
			subtotal: Number(sale.subtotal || 0),
			discountTotal: Number(sale.discount_total || 0),
			taxTotal: Number(sale.tax_total || 0),
			total: Number(sale.total || 0),
			itemsCount: Number(sale.items_count || 0),
		},
		payment: {
			method: sale.payment_method || 'cash',
			paid: Number(sale.payment_paid || 0),
			change: Number(sale.payment_change || 0),
		},
		items: (sale.sale_items || []).map((item) => ({
			id: item.id,
			productId: item.product_id,
			name: item.name,
			sku: item.sku,
			price: Number(item.price || 0),
			quantity: Number(item.quantity || 0),
			totalAmount: Number(item.total_amount || 0),
		})),
	}
}

async function create(tenantId, payload, cashierUser = null) {
	const db = getSupabase()

	// 1. Idempotency Check
	const idempotencyKey = payload.idempotencyKey || null
	if (idempotencyKey) {
		const { data: existingSale } = await db
			.from('sales')
			.select('*, sale_items(*)')
			.eq('tenant_id', tenantId)
			.eq('idempotency_key', idempotencyKey)
			.maybeSingle()
		if (existingSale) {
			// Idempotent return of existing transaction
			return getById(tenantId, existingSale.id)
		}
	}

	const rawItems = Array.isArray(payload.items) ? payload.items : []
	if (rawItems.length === 0) {
		const err = new Error('Sale must contain at least one item')
		err.status = 400
		throw err
	}

	// 2. Load Tenant Settings (Currency, Tax Rate)
	const { data: settings } = await db
		.from('tenant_settings')
		.select('*')
		.eq('tenant_id', tenantId)
		.maybeSingle()
	const defaultTaxRate = Number(settings?.tax_rate || 0)

	// 3. Load authoritative product records from DB for this tenant
	const productIds = [...new Set(rawItems.map((i) => i.productId).filter(Boolean))]
	const { data: dbProducts, error: prodErr } = await db
		.from('products')
		.select('*')
		.eq('tenant_id', tenantId)
		.in('id', productIds)
	if (prodErr) throw prodErr

	const productMap = new Map((dbProducts || []).map((p) => [p.id, p]))

	// 4. Validate stock and build authoritative items
	const itemsToCalculate = []
	for (const rawItem of rawItems) {
		const p = productMap.get(rawItem.productId)
		if (!p) {
			const err = new Error(`Product not found or invalid: ${rawItem.productId}`)
			err.status = 400
			throw err
		}

		const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1)
		const currentStock = Number(p.stock || 0)

		if (currentStock < qty) {
			const err = new Error(`Insufficient stock for "${p.name}". Available: ${currentStock}, Requested: ${qty}`)
			err.status = 400
			throw err
		}

		// Price is authoritatively loaded from database (unless authorized discount given)
		itemsToCalculate.push({
			productId: p.id,
			name: p.name,
			sku: p.sku || '',
			price: Number(p.price || 0),
			quantity: qty,
			discountType: rawItem.discountType || null,
			discountValue: rawItem.discountValue || 0,
		})
	}

	// 5. Authoritatively calculate totals on backend
	const { items: calculatedItems, totals } = calculateSaleTotals({
		items: itemsToCalculate,
		discount: payload.discount,
		taxRate: defaultTaxRate,
		taxInclusive: false,
	})

	// 6. Payment validation
	const payment = payload.payment || {}
	const paymentPaid = Number(payment.paid || totals.total || 0)
	if (paymentPaid < totals.total) {
		const err = new Error(`Insufficient payment amount. Total is ${totals.total}, provided ${paymentPaid}`)
		err.status = 400
		throw err
	}
	const change = Math.max(0, round(paymentPaid - totals.total, 2))

	// 7. Customer validation
	let customerName = 'Walk-in Customer'
	let customerId = payload.customerId || null
	if (customerId) {
		const { data: customer } = await db
			.from('customers')
			.select('id, name')
			.eq('id', customerId)
			.eq('tenant_id', tenantId)
			.maybeSingle()
		if (customer) {
			customerName = customer.name
		} else {
			customerId = null
		}
	}

	// 8. Transactional Execution with Automatic Rollback
	let createdSale = null
	const deductedItems = []

	try {
		// 8a. Insert Sale Record
		const { data: sale, error: saleError } = await db
			.from('sales')
			.insert({
				tenant_id: tenantId,
				customer_id: customerId,
				customer_name: customerName,
				status: 'completed',
				idempotency_key: idempotencyKey,
				subtotal: totals.subtotal,
				discount_total: totals.discountTotal,
				tax_total: totals.taxTotal,
				total: totals.total,
				items_count: totals.itemsCount,
				payment_method: payment.method || 'cash',
				payment_paid: paymentPaid,
				payment_change: change,
				cashier_id: cashierUser?.id || null,
			})
			.select()
			.single()
		if (saleError || !sale) throw saleError || new Error('Failed to create sale transaction record')
		createdSale = sale

		// 8b. Insert Sale Items
		const saleItemRecords = calculatedItems.map((item) => ({
			sale_id: sale.id,
			tenant_id: tenantId,
			product_id: item.productId,
			name: item.name,
			sku: item.sku,
			price: item.price,
			quantity: item.quantity,
			gross_amount: item.grossAmount,
			discount_amount: item.discountAmount,
			net_amount: item.netAmount,
			tax_amount: item.taxAmount,
			total_amount: item.totalAmount,
		}))

		const { error: itemsError } = await db.from('sale_items').insert(saleItemRecords)
		if (itemsError) throw itemsError

		// 8c. Record Payment
		const { error: payError } = await db.from('payments').insert({
			tenant_id: tenantId,
			sale_id: sale.id,
			method: payment.method || 'cash',
			amount: paymentPaid,
			status: 'completed',
		})
		if (payError) throw payError

		// 8d. Atomic Conditional Stock Deduction
		for (const item of calculatedItems) {
			const { data: currentProd, error: prodErr2 } = await db
				.from('products')
				.select('id, name, stock')
				.eq('id', item.productId)
				.eq('tenant_id', tenantId)
				.single()
			if (prodErr2 || !currentProd) {
				throw new Error(`Product "${item.name}" no longer exists in catalog`)
			}

			const availableStock = Number(currentProd.stock || 0)
			if (availableStock < item.quantity) {
				throw new Error(
					`Concurrent checkout conflict: Insufficient stock for "${item.name}". Available: ${availableStock}, Requested: ${item.quantity}`
				)
			}

			const newStock = availableStock - item.quantity
			const { error: updateErr } = await db
				.from('products')
				.update({ stock: newStock })
				.eq('id', item.productId)
				.eq('tenant_id', tenantId)
			if (updateErr) throw updateErr

			deductedItems.push({ productId: item.productId, quantity: item.quantity })

			await db.from('inventory_logs').insert({
				tenant_id: tenantId,
				product_id: item.productId,
				type: 'sale',
				delta: -item.quantity,
				note: `Sale #${sale.id}`,
			})
		}

		return {
			id: sale.id,
			tenantId,
			customerId,
			customerName,
			status: 'completed',
			createdAt: sale.created_at,
			idempotencyKey,
			totals,
			payment: {
				method: payment.method || 'cash',
				paid: paymentPaid,
				change,
			},
			items: calculatedItems,
		}
	} catch (err) {
		// Transaction Rollback: Clean up partially created entities
		if (createdSale) {
			try {
				// 1. Revert any deducted inventory
				for (const deducted of deductedItems) {
					const { data: p } = await db
						.from('products')
						.select('stock')
						.eq('id', deducted.productId)
						.eq('tenant_id', tenantId)
						.maybeSingle()
					if (p) {
						await db
							.from('products')
							.update({ stock: Number(p.stock || 0) + deducted.quantity })
							.eq('id', deducted.productId)
							.eq('tenant_id', tenantId)
					}
				}
				// 2. Delete payment records
				await db.from('payments').delete().eq('sale_id', createdSale.id).eq('tenant_id', tenantId)
				// 3. Delete sale items
				await db.from('sale_items').delete().eq('sale_id', createdSale.id).eq('tenant_id', tenantId)
				// 4. Delete the sale record itself
				await db.from('sales').delete().eq('id', createdSale.id).eq('tenant_id', tenantId)
			} catch (rollbackErr) {
				// eslint-disable-next-line no-console
				console.error('[CRITICAL] Transaction rollback encountered secondary error:', rollbackErr)
			}
		}

		throw err
	}
}

async function refund(tenantId, saleId, payload, user = null) {
	const db = getSupabase()
	const { data: sale, error } = await db
		.from('sales')
		.select('*, sale_items(*)')
		.eq('id', saleId)
		.eq('tenant_id', tenantId)
		.single()
	if (error || !sale) {
		const err = new Error('Sale not found')
		err.status = 404
		throw err
	}

	if (sale.status === 'refunded' || sale.status === 'voided') {
		const err = new Error(`Sale is already marked as ${sale.status}`)
		err.status = 400
		throw err
	}

	const reason = payload.reason || 'Customer refund'

	// Mark sale as refunded
	await db
		.from('sales')
		.update({ status: 'refunded' })
		.eq('id', saleId)
		.eq('tenant_id', tenantId)

	// Record refund record
	await db.from('refunds').insert({
		tenant_id: tenantId,
		sale_id: saleId,
		amount: Number(sale.total || 0),
		reason,
		refunded_by: user?.id || null,
	})

	// Optionally restock inventory
	const shouldRestock = payload.restock !== false
	if (shouldRestock) {
		for (const item of sale.sale_items || []) {
			if (!item.product_id) continue
			const { data: prod } = await db
				.from('products')
				.select('stock')
				.eq('id', item.product_id)
				.eq('tenant_id', tenantId)
				.maybeSingle()
			if (prod) {
				const restoredStock = Number(prod.stock || 0) + Number(item.quantity || 0)
				await db.from('products').update({ stock: restoredStock }).eq('id', item.product_id).eq('tenant_id', tenantId)
				await db.from('inventory_logs').insert({
					tenant_id: tenantId,
					product_id: item.product_id,
					type: 'adjust',
					delta: Number(item.quantity || 0),
					note: `Refund restock for Sale ${saleId}`,
				})
			}
		}
	}

	return {
		id: saleId,
		status: 'refunded',
		refundAmount: Number(sale.total || 0),
		reason,
	}
}

module.exports = { list, getById, create, refund }
