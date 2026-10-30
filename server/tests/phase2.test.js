const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890'
process.env.USE_MOCK_DB = 'true'

const app = require('../src/app')
const { getInMemoryDb } = require('../src/db/inMemoryDb')
const { hashPassword } = require('../src/utils/password')

describe('PHASE 2: Core POS & Business Workflows Tests', () => {
	let memDb
	let tenantToken
	let testSupplierId
	let testProductId

	before(async () => {
		memDb = getInMemoryDb()
		memDb.reset()

		// Setup Tenant with Pro plan (enables purchaseManagement & expenseManagement)
		memDb.getTable('tenants').push({
			id: 'tenant_pro',
			name: 'Pro Retailer',
			slug: 'pro-retailer',
			email: 'pro@retailer.com',
			plan: 'pro',
			status: 'active',
			feature_overrides: {},
			created_at: new Date().toISOString(),
		})

		memDb.getTable('users').push({
			id: 'u_pro_admin',
			tenant_id: 'tenant_pro',
			name: 'Pro Manager',
			email: 'manager@retailer.com',
			password: hashPassword('ProPass123!'),
			role: 'admin',
		})

		memDb.getTable('products').push({
			id: 'prod_stock_item',
			tenant_id: 'tenant_pro',
			name: 'Inventory Tracked Item',
			sku: 'TRACK-01',
			price: 150.00,
			cost_price: 90.00,
			stock: 10,
			created_at: new Date().toISOString(),
		})
		testProductId = 'prod_stock_item'

		// Login
		const res = await request(app)
			.post('/api/auth/login')
			.send({ email: 'manager@retailer.com', password: 'ProPass123!' })
		assert.strictEqual(res.status, 200)
		tenantToken = res.body.token
	})

	describe('1. Supplier Management', () => {
		it('should create a supplier', async () => {
			const res = await request(app)
				.post('/api/suppliers')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					name: 'Acme Wholesale Distributors',
					contactName: 'John Doe',
					phone: '+94771234567',
					email: 'orders@acme.com',
					paymentTerms: 'net30',
				})
			assert.strictEqual(res.status, 201)
			assert.strictEqual(res.body.name, 'Acme Wholesale Distributors')
			assert.strictEqual(res.body.paymentTerms, 'net30')
			testSupplierId = res.body.id
		})

		it('should list all suppliers for the tenant', async () => {
			const res = await request(app)
				.get('/api/suppliers')
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.ok(Array.isArray(res.body))
			const found = res.body.find((s) => s.id === testSupplierId)
			assert.ok(found)
		})
	})

	describe('2. Procurement & Goods Received Notes (GRN)', () => {
		it('should receive purchase order and increment inventory stock automatically', async () => {
			// Product stock before GRN: 10
			const prodBefore = memDb.getTable('products').find((p) => p.id === testProductId)
			assert.strictEqual(prodBefore.stock, 10)

			const res = await request(app)
				.post('/api/purchases')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					supplierId: testSupplierId,
					notes: 'Delivery Batch #992',
					items: [
						{ productId: testProductId, name: 'Inventory Tracked Item', quantity: 20, costPrice: 85.00 },
					],
				})

			assert.strictEqual(res.status, 201)
			assert.strictEqual(res.body.total, 1700.00) // 20 * 85
			assert.strictEqual(res.body.supplierName, 'Acme Wholesale Distributors')

			// Stock should increase from 10 to 30
			const prodAfter = memDb.getTable('products').find((p) => p.id === testProductId)
			assert.strictEqual(prodAfter.stock, 30)
			assert.strictEqual(prodAfter.cost_price, 85.00)

			// Verify inventory_logs entry created
			const logs = memDb.getTable('inventory_logs').filter((l) => l.product_id === testProductId && l.type === 'purchase')
			assert.ok(logs.length > 0)
			assert.strictEqual(logs[logs.length - 1].delta, 20)
		})

		it('should list purchases history', async () => {
			const res = await request(app)
				.get('/api/purchases')
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.ok(Array.isArray(res.body))
			assert.strictEqual(res.body.length, 1)
		})
	})

	describe('3. Business Expenses Management', () => {
		let createdExpenseId

		it('should record an operational business expense', async () => {
			const res = await request(app)
				.post('/api/expenses')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					title: 'Monthly Internet Connection',
					category: 'Utilities',
					amount: 4500.00,
					paymentMethod: 'bank_transfer',
					notes: 'Fiber broadband bill',
				})
			assert.strictEqual(res.status, 201)
			assert.strictEqual(res.body.title, 'Monthly Internet Connection')
			assert.strictEqual(res.body.amount, 4500.00)
			assert.strictEqual(res.body.category, 'Utilities')
			createdExpenseId = res.body.id
		})

		it('should list tenant expenses', async () => {
			const res = await request(app)
				.get('/api/expenses')
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.ok(Array.isArray(res.body))
			const found = res.body.find((e) => e.id === createdExpenseId)
			assert.ok(found)
		})

		it('should delete an expense record', async () => {
			const res = await request(app)
				.delete(`/api/expenses/${createdExpenseId}`)
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.ok, true)

			const expensesNow = memDb.getTable('expenses').find((e) => e.id === createdExpenseId)
			assert.strictEqual(expensesNow, undefined)
		})
	})
})
