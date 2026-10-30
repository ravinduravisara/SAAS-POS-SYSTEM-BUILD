const { getSupabase } = require('../../config/db')
const { round, multiply, add } = require('../../../../shared/utils/decimal')

async function setupFloorPlan(tenantId) {
	const db = getSupabase()
	const initialTables = [
		{ tenant_id: tenantId, table_number: 'T1', capacity: 2, floor: 'Main Dining', status: 'available' },
		{ tenant_id: tenantId, table_number: 'T2', capacity: 4, floor: 'Main Dining', status: 'available' },
		{ tenant_id: tenantId, table_number: 'T3', capacity: 4, floor: 'Main Dining', status: 'available' },
		{ tenant_id: tenantId, table_number: 'T4', capacity: 6, floor: 'Balcony', status: 'available' },
		{ tenant_id: tenantId, table_number: 'T5', capacity: 8, floor: 'VIP Lounge', status: 'available' },
	]
	const { data, error } = await db.from('restaurant_tables').insert(initialTables).select()
	if (error) throw error
	return (data || initialTables).map((t) => ({
		id: t.id,
		tableNumber: t.table_number,
		capacity: t.capacity,
		floor: t.floor,
		status: t.status,
	}))
}

async function listTables(tenantId) {
	const db = getSupabase()
	const { data, error } = await db
		.from('restaurant_tables')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('table_number', { ascending: true })
	if (error) throw error

	// If tenant has no tables yet, initialize default floor plan
	if (!data || data.length === 0) {
		return setupFloorPlan(tenantId)
	}

	return data.map((t) => ({
		id: t.id,
		tableNumber: t.table_number,
		capacity: t.capacity,
		floor: t.floor,
		status: t.status,
	}))
}

async function updateTableStatus(tenantId, tableId, status) {
	const validStatuses = new Set(['available', 'occupied', 'reserved'])
	if (!validStatuses.has(status)) {
		const err = new Error(`Invalid table status "${status}". Allowed: available, occupied, reserved`)
		err.status = 400
		throw err
	}

	const { data, error } = await getSupabase()
		.from('restaurant_tables')
		.update({ status })
		.eq('id', tableId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	return data
}

async function listActiveKitchenOrders(tenantId) {
	const { data, error } = await getSupabase()
		.from('restaurant_orders')
		.select('*')
		.eq('tenant_id', tenantId)
		.in('status', ['placed', 'preparing', 'ready'])
		.order('created_at', { ascending: true })
	if (error) throw error
	return (data || []).map((o) => ({
		id: o.id,
		tableId: o.table_id,
		tableNumber: o.table_number || 'T1',
		waiterName: o.waiter_name || 'Staff',
		status: o.status,
		items: o.items || [],
		total: Number(o.total || 0),
		createdAt: o.created_at,
	}))
}

async function placeOrder(tenantId, payload, user = null) {
	const db = getSupabase()
	const rawItems = Array.isArray(payload.items) ? payload.items : []
	if (rawItems.length === 0) {
		const err = new Error('Order must contain at least one item')
		err.status = 400
		throw err
	}

	// Validate table if provided
	let tableNumber = payload.tableNumber || 'T1'
	if (payload.tableId) {
		const { data: tableData, error: tableErr } = await db
			.from('restaurant_tables')
			.select('id, table_number, status')
			.eq('id', payload.tableId)
			.eq('tenant_id', tenantId)
			.maybeSingle()
		if (tableErr || !tableData) {
			const err = new Error('Invalid dining table specified')
			err.status = 400
			throw err
		}
		tableNumber = tableData.table_number
	}

	// Authoritatively resolve product pricing from tenant catalog (prevent price spoofing)
	let total = 0
	const orderItems = []

	for (const item of rawItems) {
		const qty = Math.max(1, parseInt(item.quantity, 10) || 1)
		let unitPrice = Number(item.price || 0)
		let productName = item.name || 'Dish'

		// 1. Check if product exists by ID
		if (item.productId) {
			const { data: dbProd } = await db
				.from('products')
				.select('id, name, price')
				.eq('id', item.productId)
				.eq('tenant_id', tenantId)
				.maybeSingle()
			if (dbProd) {
				unitPrice = Number(dbProd.price) // Authoritative price from DB
				productName = dbProd.name
			}
		} else if (item.name) {
			// 2. Check if product exists by Name
			const { data: dbProdByName } = await db
				.from('products')
				.select('id, name, price')
				.eq('name', item.name)
				.eq('tenant_id', tenantId)
				.maybeSingle()
			if (dbProdByName) {
				unitPrice = Number(dbProdByName.price) // Authoritative price from DB
			}
		}

		if (unitPrice < 0 || isNaN(unitPrice)) {
			const err = new Error(`Invalid price for item "${productName}"`)
			err.status = 400
			throw err
		}

		const lineTotal = multiply(unitPrice, qty)
		total = add(total, lineTotal)

		orderItems.push({
			productId: item.productId || null,
			name: productName,
			quantity: qty,
			price: round(unitPrice, 2),
			notes: item.notes || '',
		})
	}

	// Insert order
	const { data: order, error } = await db
		.from('restaurant_orders')
		.insert({
			tenant_id: tenantId,
			table_id: payload.tableId || null,
			table_number: tableNumber,
			waiter_name: user?.name || payload.waiterName || 'Staff',
			items: orderItems,
			status: 'placed',
			total: round(total, 2),
		})
		.select()
		.single()
	if (error) throw error

	// Mark table as occupied
	if (payload.tableId) {
		await db.from('restaurant_tables').update({ status: 'occupied' }).eq('id', payload.tableId).eq('tenant_id', tenantId)
	}

	return {
		id: order.id,
		tableId: order.table_id,
		tableNumber: order.table_number,
		status: order.status,
		items: order.items,
		total: Number(order.total || 0),
		createdAt: order.created_at,
	}
}

async function updateOrderStatus(tenantId, orderId, status) {
	const db = getSupabase()
	const validStatuses = new Set(['placed', 'preparing', 'ready', 'served', 'paid', 'cancelled'])
	if (!validStatuses.has(status)) {
		const err = new Error('Invalid kitchen order status')
		err.status = 400
		throw err
	}

	const { data, error } = await db
		.from('restaurant_orders')
		.update({ status })
		.eq('id', orderId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error

	// If paid or cancelled, free up the table
	if ((status === 'paid' || status === 'cancelled') && data.table_id) {
		await db.from('restaurant_tables').update({ status: 'available' }).eq('id', data.table_id).eq('tenant_id', tenantId)
	}

	return data
}

module.exports = {
	setupFloorPlan,
	listTables,
	updateTableStatus,
	listActiveKitchenOrders,
	placeOrder,
	updateOrderStatus,
}
