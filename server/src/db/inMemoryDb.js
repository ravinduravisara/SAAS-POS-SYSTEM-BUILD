/**
 * Universal SaaS POS + ERP — In-Memory PostgreSQL/Supabase Provider
 * Enables hermetic unit, integration, and security testing without requiring external cloud connectivity.
 */

class MockQueryBuilder {
	constructor(store, tableName) {
		this.store = store
		this.tableName = tableName
		this.filters = []
		this.orders = []
		this.limitCount = null
		this.isSingle = false
		this.isMaybeSingle = false
		this.countMode = null
		this.selectedColumns = '*'
		this.operation = 'select'
		this.payload = null
		this.upsertOptions = null
	}

	select(columns = '*', options = {}) {
		this.selectedColumns = columns
		if (options?.count) {
			this.countMode = options.count
			if (options.head) {
				this.operation = 'count_head'
			}
		}
		return this
	}

	insert(data) {
		this.operation = 'insert'
		this.payload = data
		return this
	}

	update(data) {
		this.operation = 'update'
		this.payload = data
		return this
	}

	upsert(data, options = {}) {
		this.operation = 'upsert'
		this.payload = data
		this.upsertOptions = options
		return this
	}

	delete() {
		this.operation = 'delete'
		return this
	}

	eq(column, value) {
		this.filters.push((row) => row[column] === value)
		return this
	}

	neq(column, value) {
		this.filters.push((row) => row[column] !== value)
		return this
	}

	in(column, values) {
		const set = new Set(values || [])
		this.filters.push((row) => set.has(row[column]))
		return this
	}

	lte(column, value) {
		this.filters.push((row) => Number(row[column]) <= Number(value))
		return this
	}

	gte(column, value) {
		this.filters.push((row) => Number(row[column]) >= Number(value))
		return this
	}

	lt(column, value) {
		this.filters.push((row) => Number(row[column]) < Number(value))
		return this
	}

	gt(column, value) {
		this.filters.push((row) => Number(row[column]) > Number(value))
		return this
	}

	order(column, options = {}) {
		this.orders.push({ column, ascending: options.ascending !== false })
		return this
	}

	limit(count) {
		this.limitCount = count
		return this
	}

	single() {
		this.isSingle = true
		return this.execute()
	}

	maybeSingle() {
		this.isMaybeSingle = true
		return this.execute()
	}

	then(resolve, reject) {
		return this.execute().then(resolve, reject)
	}

	async execute() {
		const table = this.store.getTable(this.tableName)

		if (this.operation === 'insert') {
			const items = Array.isArray(this.payload) ? this.payload : [this.payload]
			const inserted = []

			for (const item of items) {
				const idPrefix = this.tableName.substring(0, 3) + '_'
				const row = {
					id: item.id || `${idPrefix}${Math.random().toString(36).substring(2, 9)}`,
					created_at: item.created_at || new Date().toISOString(),
					...item,
				}
				table.push(row)
				inserted.push({ ...row })
			}

			const data = Array.isArray(this.payload) ? inserted : inserted[0]
			return { data, error: null }
		}

		if (this.operation === 'upsert') {
			const items = Array.isArray(this.payload) ? this.payload : [this.payload]
			const onConflict = this.upsertOptions?.onConflict || 'id'
			const upserted = []

			for (const item of items) {
				const conflictVal = item[onConflict]
				const existingIndex = table.findIndex((r) => r[onConflict] === conflictVal)
				if (existingIndex >= 0) {
					table[existingIndex] = { ...table[existingIndex], ...item }
					upserted.push({ ...table[existingIndex] })
				} else {
					const row = {
						id: item.id || `${this.tableName.substring(0, 3)}_${Math.random().toString(36).substring(2, 9)}`,
						created_at: new Date().toISOString(),
						...item,
					}
					table.push(row)
					upserted.push({ ...row })
				}
			}

			const data = Array.isArray(this.payload) ? upserted : upserted[0]
			return { data, error: null }
		}

		if (this.operation === 'update') {
			const matched = []
			for (let i = 0; i < table.length; i++) {
				const row = table[i]
				const matches = this.filters.every((fn) => fn(row))
				if (matches) {
					table[i] = { ...row, ...this.payload }
					matched.push({ ...table[i] })
				}
			}
			const data = this.isSingle ? matched[0] || null : matched
			return { data, error: null }
		}

		if (this.operation === 'delete') {
			let deletedCount = 0
			for (let i = table.length - 1; i >= 0; i--) {
				const row = table[i]
				if (this.filters.every((fn) => fn(row))) {
					table.splice(i, 1)
					deletedCount++
				}
			}
			return { data: { count: deletedCount }, error: null }
		}

		// SELECT operation
		let result = table.filter((row) => this.filters.every((fn) => fn(row)))
		const count = result.length

		for (const ord of this.orders) {
			result.sort((a, b) => {
				const valA = a[ord.column]
				const valB = b[ord.column]
				if (valA < valB) return ord.ascending ? -1 : 1
				if (valA > valB) return ord.ascending ? 1 : -1
				return 0
			})
		}

		if (this.limitCount !== null) {
			result = result.slice(0, this.limitCount)
		}

		// Handle embedded relations (e.g. sale_items(*))
		if (typeof this.selectedColumns === 'string' && this.selectedColumns.includes('sale_items(*)')) {
			const saleItemsTable = this.store.getTable('sale_items')
			result = result.map((sale) => {
				const items = saleItemsTable.filter((si) => si.sale_id === sale.id)
				return { ...sale, sale_items: items }
			})
		}

		if (this.countMode && this.operation === 'count_head') {
			return { data: null, count, error: null }
		}

		if (this.isSingle) {
			if (result.length === 0) {
				const err = new Error('Row not found')
				err.code = 'PGRST116'
				return { data: null, error: err }
			}
			return { data: { ...result[0] }, count, error: null }
		}

		if (this.isMaybeSingle) {
			return { data: result[0] ? { ...result[0] } : null, count, error: null }
		}

		return { data: result.map((r) => ({ ...r })), count, error: null }
	}
}

class InMemoryDbStore {
	constructor() {
		this.reset()
	}

	reset() {
		this.tables = {
			super_admins: [
				{
					id: 'sa_1',
					email: 'superadmin@posplatform.com',
					password: 'pbkdf2$100000$mock_salt$mock_hash', // Will be re-hashed properly
					created_at: new Date().toISOString(),
				},
			],
			tenants: [
				{
					id: 'tenant_demo',
					name: 'Demo Store',
					slug: 'demo',
					email: 'owner@demo.com',
					plan: 'pro',
					status: 'active',
					feature_overrides: {},
					trial_ends_at: null,
					created_at: new Date().toISOString(),
				},
			],
			tenant_settings: [
				{
					id: 'ts_demo',
					tenant_id: 'tenant_demo',
					currency: 'LKR',
					tax_rate: 0,
					store_name: 'Demo Store',
					timezone: 'Asia/Colombo',
				},
			],
			subscriptions: [
				{
					id: 'sub_demo',
					tenant_id: 'tenant_demo',
					plan: 'pro',
					status: 'active',
					amount: 29.99,
					started_at: new Date().toISOString(),
					created_at: new Date().toISOString(),
				},
			],
			users: [
				{
					id: 'u_admin',
					tenant_id: 'tenant_demo',
					name: 'Demo Admin',
					email: 'admin@example.com',
					password: 'pbkdf2$100000$mock_salt$mock_hash',
					role: 'admin',
					created_at: new Date().toISOString(),
				},
			],
			categories: [
				{ id: 'c_general', tenant_id: 'tenant_demo', name: 'General', created_at: new Date().toISOString() },
				{ id: 'c_bev', tenant_id: 'tenant_demo', name: 'Beverages', created_at: new Date().toISOString() },
			],
			products: [
				{ id: 'p_item_a', tenant_id: 'tenant_demo', name: 'Item A', sku: 'A-001', price: 250, stock: 20, category_id: 'c_general', created_at: new Date().toISOString() },
				{ id: 'p_item_b', tenant_id: 'tenant_demo', name: 'Item B', sku: 'B-001', price: 450, stock: 12, category_id: 'c_bev', created_at: new Date().toISOString() },
				{ id: 'p_item_c', tenant_id: 'tenant_demo', name: 'Item C', sku: 'C-001', price: 120, stock: 35, category_id: 'c_general', created_at: new Date().toISOString() },
			],
			customers: [
				{ id: 'cu_1', tenant_id: 'tenant_demo', name: 'Walk-in Customer', phone: '0771234567', email: 'customer@example.com', created_at: new Date().toISOString() },
			],
			sales: [],
			sale_items: [],
			inventory_logs: [],
			purchases: [],
			expenses: [],
			registers: [],
			cash_shifts: [],
			payments: [],
			refunds: [],
			returns: [],
			audit_logs: [],
			idempotency_keys: [],
		}
	}

	getTable(name) {
		if (!this.tables[name]) {
			this.tables[name] = []
		}
		return this.tables[name]
	}

	from(tableName) {
		return new MockQueryBuilder(this, tableName)
	}
}

const singletonStore = new InMemoryDbStore()

function getInMemoryDb() {
	return singletonStore
}

module.exports = { getInMemoryDb, InMemoryDbStore }

