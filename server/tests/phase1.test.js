const { describe, it, before, beforeEach } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

// Ensure test environment uses in-memory DB and high rate limits
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890'
process.env.USE_MOCK_DB = 'true'

const app = require('../src/app')
const { getInMemoryDb } = require('../src/db/inMemoryDb')
const { hashPassword } = require('../src/utils/password')
const { calculateSaleTotals } = require('../src/utils/calculateSaleTotals')

describe('PHASE 1: Core SaaS POS + ERP Stabilization Tests', () => {
	let memDb
	let tenantAToken
	let tenantBToken
	let superAdminToken

	before(async () => {
		memDb = getInMemoryDb()
		memDb.reset()

		// Setup Super Admin
		memDb.getTable('super_admins').push({
			id: 'sa_test',
			email: 'superadmin@test.com',
			password: hashPassword('SuperAdminPass123!'),
		})

		// Setup Tenant A (Demo Supermarket)
		memDb.getTable('tenants').push({
			id: 'tenant_a',
			name: 'Tenant A Store',
			slug: 'tenant-a',
			email: 'admin@tenanta.com',
			plan: 'starter', // maxUsers: 2, maxProducts: 100
			status: 'active',
			feature_overrides: {},
			created_at: new Date().toISOString(),
		})

		memDb.getTable('tenant_settings').push({
			id: 'ts_a',
			tenant_id: 'tenant_a',
			currency: 'LKR',
			tax_rate: 0.10, // 10%
			store_name: 'Tenant A Store',
			timezone: 'Asia/Colombo',
		})

		memDb.getTable('users').push({
			id: 'u_a1',
			tenant_id: 'tenant_a',
			name: 'Alice Admin',
			email: 'alice@tenanta.com',
			password: hashPassword('AlicePass123!'),
			role: 'admin',
		})

		memDb.getTable('products').push({
			id: 'prod_a1',
			tenant_id: 'tenant_a',
			name: 'Product A1',
			sku: 'A1-SKU',
			price: 100.00,
			stock: 10,
			created_at: new Date().toISOString(),
		})

		// Setup Tenant B (XYZ Restaurant)
		memDb.getTable('tenants').push({
			id: 'tenant_b',
			name: 'Tenant B Restaurant',
			slug: 'tenant-b',
			email: 'admin@tenantb.com',
			plan: 'pro',
			status: 'active',
			feature_overrides: {},
			created_at: new Date().toISOString(),
		})

		memDb.getTable('tenant_settings').push({
			id: 'ts_b',
			tenant_id: 'tenant_b',
			currency: 'USD',
			tax_rate: 0.05,
			store_name: 'Tenant B Restaurant',
			timezone: 'Asia/Colombo',
		})

		memDb.getTable('users').push({
			id: 'u_b1',
			tenant_id: 'tenant_b',
			name: 'Bob Admin',
			email: 'bob@tenantb.com',
			password: hashPassword('BobPass123!'),
			role: 'admin',
		})

		memDb.getTable('products').push({
			id: 'prod_b1',
			tenant_id: 'tenant_b',
			name: 'Product B1 Secret Item',
			sku: 'B1-SKU',
			price: 50.00,
			stock: 5,
			created_at: new Date().toISOString(),
		})

		// Login Super Admin
		const saRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'superadmin@test.com', password: 'SuperAdminPass123!' })
		assert.strictEqual(saRes.status, 200)
		assert.strictEqual(saRes.body.isSuperAdmin, true)
		superAdminToken = saRes.body.token

		// Login Tenant A Admin
		const aRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'alice@tenanta.com', password: 'AlicePass123!' })
		assert.strictEqual(aRes.status, 200)
		assert.strictEqual(aRes.body.tenant.id, 'tenant_a')
		tenantAToken = aRes.body.token

		// Login Tenant B Admin
		const bRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'bob@tenantb.com', password: 'BobPass123!' })
		assert.strictEqual(bRes.status, 200)
		assert.strictEqual(bRes.body.tenant.id, 'tenant_b')
		tenantBToken = bRes.body.token
	})

	describe('1. Authentication & Security', () => {
		it('should reject login with wrong password', async () => {
			const res = await request(app)
				.post('/api/auth/login')
				.send({ email: 'alice@tenanta.com', password: 'WrongPassword' })
			assert.strictEqual(res.status, 401)
		})

		it('should reject login with non-existent email', async () => {
			const res = await request(app)
				.post('/api/auth/login')
				.send({ email: 'nonexistent@nowhere.com', password: 'Password123!' })
			assert.strictEqual(res.status, 401)
		})

		it('should return current user and tenant details from /auth/me', async () => {
			const res = await request(app)
				.get('/api/auth/me')
				.set('Authorization', `Bearer ${tenantAToken}`)
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.user.email, 'alice@tenanta.com')
			assert.strictEqual(res.body.tenant.id, 'tenant_a')
		})

		it('should reject access to protected routes without a token', async () => {
			const res = await request(app).get('/api/products')
			assert.strictEqual(res.status, 401)
		})

		it('should reject access with invalid or forged token', async () => {
			const res = await request(app)
				.get('/api/products')
				.set('Authorization', 'Bearer forged-invalid-token')
			assert.strictEqual(res.status, 401)
		})
	})

	describe('2. Multi-Tenant Logical Data Isolation', () => {
		it('Tenant A should only see Tenant A products and not Tenant B products', async () => {
			const res = await request(app)
				.get('/api/products')
				.set('Authorization', `Bearer ${tenantAToken}`)
			assert.strictEqual(res.status, 200)
			const names = res.body.map((p) => p.name)
			assert.ok(names.includes('Product A1'))
			assert.strictEqual(names.includes('Product B1 Secret Item'), false)
		})

		it('Tenant B should only see Tenant B products and not Tenant A products', async () => {
			const res = await request(app)
				.get('/api/products')
				.set('Authorization', `Bearer ${tenantBToken}`)
			assert.strictEqual(res.status, 200)
			const names = res.body.map((p) => p.name)
			assert.ok(names.includes('Product B1 Secret Item'))
			assert.strictEqual(names.includes('Product A1'), false)
		})

		it('Tenant A cannot update or overwrite Tenant B products', async () => {
			const res = await request(app)
				.put('/api/products/prod_b1')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({ name: 'Hacked Item' })
			assert.strictEqual(res.status, 404)

			// Verify Tenant B product is untouched
			const bProd = memDb.getTable('products').find((p) => p.id === 'prod_b1')
			assert.strictEqual(bProd.name, 'Product B1 Secret Item')
		})

		it('Tenant A cannot delete Tenant B products', async () => {
			await request(app)
				.delete('/api/products/prod_b1')
				.set('Authorization', `Bearer ${tenantAToken}`)

			const bProd = memDb.getTable('products').find((p) => p.id === 'prod_b1')
			assert.ok(bProd, 'Tenant B product should not be deleted by Tenant A')
		})
	})

	describe('3. POS Transaction Integrity & Concurrency Safety', () => {
		it('backend authoritatively calculates prices, tax, and ignores spoofed frontend totals', async () => {
			const res = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({
					items: [{ productId: 'prod_a1', quantity: 2, price: 1.00 }], // Attempt to spoof price to $1
					totals: { total: 2.00, subtotal: 2.00 }, // Spoofed frontend total
					payment: { method: 'cash', paid: 500.00 },
				})

			assert.strictEqual(res.status, 201)
			// Database price is $100. For 2 units: subtotal = 200. Tax rate 10% = 20. Grand total = 220.
			assert.strictEqual(res.body.totals.subtotal, 200.00)
			assert.strictEqual(res.body.totals.taxTotal, 20.00)
			assert.strictEqual(res.body.totals.total, 220.00)
			assert.strictEqual(res.body.payment.change, 280.00) // 500 - 220

			// Stock should have decreased from 10 to 8
			const updatedProd = memDb.getTable('products').find((p) => p.id === 'prod_a1')
			assert.strictEqual(updatedProd.stock, 8)
		})

		it('rejects sale when requested quantity exceeds available stock', async () => {
			const res = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({
					items: [{ productId: 'prod_a1', quantity: 999 }], // Stock is only 8
					payment: { method: 'cash', paid: 200000 },
				})

			assert.strictEqual(res.status, 400)
			assert.match(res.body.message, /Insufficient stock/i)
		})

		it('enforces idempotency keys to prevent duplicate sales on repeated requests', async () => {
			const idempotencyKey = 'unique-idemp-key-xyz-123'
			const payload = {
				idempotencyKey,
				items: [{ productId: 'prod_a1', quantity: 1 }],
				payment: { method: 'cash', paid: 200.00 },
			}

			// First request: stock decreases from 8 to 7
			const firstRes = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send(payload)
			assert.strictEqual(firstRes.status, 201)
			const firstSaleId = firstRes.body.id

			const prodAfterFirst = memDb.getTable('products').find((p) => p.id === 'prod_a1')
			assert.strictEqual(prodAfterFirst.stock, 7)

			// Repeated duplicate request with identical idempotency key
			const duplicateRes = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send(payload)
			assert.strictEqual(duplicateRes.status, 201)
			assert.strictEqual(duplicateRes.body.id, firstSaleId)

			// Stock should NOT decrease a second time!
			const prodAfterDuplicate = memDb.getTable('products').find((p) => p.id === 'prod_a1')
			assert.strictEqual(prodAfterDuplicate.stock, 7)
		})

		it('refunds sale and restores inventory accurately', async () => {
			// Create a 2-unit sale (stock 7 -> 5)
			const saleRes = await request(app)
				.post('/api/sales')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({
					items: [{ productId: 'prod_a1', quantity: 2 }],
					payment: { method: 'cash', paid: 300.00 },
				})
			assert.strictEqual(saleRes.status, 201)
			const saleId = saleRes.body.id

			const prodBeforeRefund = memDb.getTable('products').find((p) => p.id === 'prod_a1')
			assert.strictEqual(prodBeforeRefund.stock, 5)

			// Process Refund
			const refundRes = await request(app)
				.post(`/api/sales/${saleId}/refund`)
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({ reason: 'Defective item', restock: true })
			assert.strictEqual(refundRes.status, 200)
			assert.strictEqual(refundRes.body.status, 'refunded')

			// Stock should be restored back from 5 to 7
			const prodAfterRefund = memDb.getTable('products').find((p) => p.id === 'prod_a1')
			assert.strictEqual(prodAfterRefund.stock, 7)
		})
	})

	describe('4. Subscription Usage Limits Enforcement', () => {
		it('enforces maximum user limits for Starter plan (max 2 users)', async () => {
			// Tenant A currently has 1 user (Alice) on Starter plan (maxUsers: 2)
			// Create 2nd user -> should succeed
			const user2Res = await request(app)
				.post('/api/users')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({ name: 'User 2', email: 'user2@tenanta.com', password: 'Password123!', role: 'cashier' })
			assert.strictEqual(user2Res.status, 201)

			// Attempt to create 3rd user -> must be rejected by backend
			const user3Res = await request(app)
				.post('/api/users')
				.set('Authorization', `Bearer ${tenantAToken}`)
				.send({ name: 'User 3', email: 'user3@tenanta.com', password: 'Password123!', role: 'cashier' })
			assert.strictEqual(user3Res.status, 403)
			assert.match(user3Res.body.message, /User limit reached/i)
		})
	})
})
