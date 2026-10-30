const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890'
process.env.USE_MOCK_DB = 'true'

const app = require('../src/app')
const { getInMemoryDb } = require('../src/db/inMemoryDb')
const { hashPassword } = require('../src/utils/password')
const { getSupabase } = require('../src/config/db')
const envConfig = require('../src/config/env')

describe('PHASE 6: Production Hardening, Concurrency & Transactions Tests', () => {
	let memDb
	let tenantToken

	before(async () => {
		memDb = getInMemoryDb()
		memDb.reset()

		memDb.getTable('tenants').push({
			id: 'tenant_hardened',
			name: 'Hardened Store',
			slug: 'hardened-store',
			email: 'admin@hardened.com',
			plan: 'enterprise',
			status: 'active',
			feature_overrides: { 'restaurant.core': true },
			created_at: new Date().toISOString(),
		})

		memDb.getTable('tenant_settings').push({
			id: 'ts_hardened',
			tenant_id: 'tenant_hardened',
			currency: 'LKR',
			tax_rate: 0.10,
			store_name: 'Hardened Store',
			timezone: 'Asia/Colombo',
			created_at: new Date().toISOString(),
		})

		memDb.getTable('users').push({
			id: 'user_hardened',
			tenant_id: 'tenant_hardened',
			name: 'Hardened Admin',
			email: 'admin@hardened.com',
			password: hashPassword('HardenedPass123!'),
			role: 'admin',
			created_at: new Date().toISOString(),
		})

		// Catalog product with 5 units in stock
		memDb.getTable('products').push({
			id: 'prod_limited_stock',
			tenant_id: 'tenant_hardened',
			name: 'Limited Stock Phone',
			sku: 'HARD-PH-01',
			price: 1000,
			cost: 700,
			stock: 5,
			created_at: new Date().toISOString(),
		})

		// Menu item for restaurant
		memDb.getTable('products').push({
			id: 'prod_menu_steak',
			tenant_id: 'tenant_hardened',
			name: 'Wagyu Ribeye Steak',
			sku: 'REST-STEAK-01',
			price: 8500,
			cost: 4500,
			stock: 50,
			created_at: new Date().toISOString(),
		})

		const loginRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'admin@hardened.com', password: 'HardenedPass123!' })
		tenantToken = loginRes.body.token
	})

	describe('1. Production Database Policy & Readiness Probes', () => {
		it('should return 200 OK on /health probe', async () => {
			const res = await request(app).get('/health')
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.ok, true)
		})

		it('should return 200 OK on /ready probe when database is available', async () => {
			const res = await request(app).get('/ready')
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.ok, true)
			assert.strictEqual(res.body.status, 'ready')
		})

		it('strictly throws fatal error when USE_MOCK_DB=true in production', () => {
			const originalEnv = process.env.NODE_ENV
			const originalMock = process.env.USE_MOCK_DB

			try {
				process.env.NODE_ENV = 'production'
				process.env.USE_MOCK_DB = 'true'

				assert.throws(
					() => {
						getSupabase()
					},
					(err) => {
						assert(err.message.includes('USE_MOCK_DB cannot be enabled in production'))
						return true
					},
				)
			} finally {
				process.env.NODE_ENV = originalEnv
				process.env.USE_MOCK_DB = originalMock
			}
		})

		it('strictly throws fatal error when NODE_ENV=production has missing Supabase credentials', () => {
			const originalEnv = process.env.NODE_ENV
			const originalUrl = process.env.SUPABASE_URL
			const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY
			const originalMock = process.env.USE_MOCK_DB
			const originalEnvUrl = envConfig.supabaseUrl
			const originalEnvKey = envConfig.supabaseServiceRoleKey

			try {
				process.env.NODE_ENV = 'production'
				delete process.env.SUPABASE_URL
				delete process.env.SUPABASE_SERVICE_ROLE_KEY
				delete process.env.USE_MOCK_DB
				envConfig.supabaseUrl = ''
				envConfig.supabaseServiceRoleKey = ''

				assert.throws(
					() => {
						getSupabase()
					},
					(err) => {
						assert(err.message.includes('Missing required Supabase credentials in production'))
						return true
					},
				)
			} finally {
				process.env.NODE_ENV = originalEnv
				if (originalUrl) process.env.SUPABASE_URL = originalUrl
				if (originalKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
				if (originalMock) process.env.USE_MOCK_DB = originalMock
				envConfig.supabaseUrl = originalEnvUrl
				envConfig.supabaseServiceRoleKey = originalEnvKey
			}
		})
	})

	describe('2. POS Concurrency & Atomic Inventory Protection', () => {
		it('strictly rejects sale when requested quantity exceeds available stock without decrementing stock', async () => {
			const initialStock = memDb.getTable('products').find((p) => p.id === 'prod_limited_stock').stock
			assert.strictEqual(initialStock, 5)

			const res = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					items: [
						{ productId: 'prod_limited_stock', quantity: 10 }, // 10 requested, only 5 in stock!
					],
					paymentMethod: 'cash',
					paymentDetails: { amountReceived: 10000 },
				})

			assert.strictEqual(res.status, 400)
			assert(res.body.error.message.includes('Insufficient stock'))

			// Verify stock was NOT altered
			const currentStock = memDb.getTable('products').find((p) => p.id === 'prod_limited_stock').stock
			assert.strictEqual(currentStock, 5)
		})

		it('processes legitimate sale and decrements stock atomically', async () => {
			const res = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					items: [
						{ productId: 'prod_limited_stock', quantity: 2 },
					],
					paymentMethod: 'cash',
					paymentDetails: { amountReceived: 3000 },
				})

			assert.strictEqual(res.status, 201)
			assert.strictEqual(res.body.items.length, 1)

			// Verify stock decremented to 3
			const currentStock = memDb.getTable('products').find((p) => p.id === 'prod_limited_stock').stock
			assert.strictEqual(currentStock, 3)
		})
	})

	describe('3. Authoritative Restaurant Catalog Pricing', () => {
		it('ignores client-spoofed zero or cheap price and resolves authentic DB price', async () => {
			// Initialize table
			await request(app)
				.get('/api/restaurant/tables')
				.set('Authorization', `Bearer ${tenantToken}`)

			const table = memDb.getTable('restaurant_tables').find((t) => t.tenant_id === 'tenant_hardened')

			const res = await request(app)
				.post('/api/restaurant/orders')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					tableId: table.id,
					tableNumber: table.table_number,
					waiterName: 'Test Server',
					items: [
						{
							productId: 'prod_menu_steak',
							name: 'Wagyu Ribeye Steak',
							quantity: 2,
							price: 50, // Malicious client attempt: Rs. 50 instead of Rs. 8500!
						},
					],
				})

			assert.strictEqual(res.status, 201)
			// Verified server authoritatively set price from product catalog (8500 * 2 = 17000)
			const orderedItem = res.body.items[0]
			assert.strictEqual(orderedItem.price, 8500)
			assert.strictEqual(orderedItem.quantity, 2)
		})
	})
})
