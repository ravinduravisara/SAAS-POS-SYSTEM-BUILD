const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890'
process.env.USE_MOCK_DB = 'true'

const app = require('../src/app')
const { getInMemoryDb } = require('../src/db/inMemoryDb')
const { hashPassword } = require('../src/utils/password')

describe('PHASE 4: Multi-Branch & Finance Reporting Tests', () => {
	let memDb
	let tenantToken

	before(async () => {
		memDb = getInMemoryDb()
		memDb.reset()

		// Setup Tenant with max_branches: 2
		memDb.getTable('tenants').push({
			id: 'tenant_branches',
			name: 'Multi-Location Enterprise',
			slug: 'multi-location',
			email: 'admin@multiloc.com',
			plan: 'pro',
			status: 'active',
			max_branches: 2,
			feature_overrides: { reports: true },
			created_at: new Date().toISOString(),
		})

		memDb.getTable('users').push({
			id: 'u_branch_admin',
			tenant_id: 'tenant_branches',
			name: 'Branch Operations Lead',
			email: 'lead@multiloc.com',
			password: hashPassword('Pass123!Secure'),
			role: 'admin',
		})

		// Seed a completed sale
		memDb.getTable('sales').push({
			id: 's_rep_1',
			tenant_id: 'tenant_branches',
			customer_name: 'Walk-in',
			status: 'completed',
			subtotal: 1000,
			total: 1100,
			discount_total: 0,
			tax_total: 100,
			items_count: 2,
			payment_method: 'card',
			created_at: new Date().toISOString(),
		})

		memDb.getTable('sale_items').push({
			id: 'si_rep_1',
			sale_id: 's_rep_1',
			tenant_id: 'tenant_branches',
			product_id: 'p_alpha',
			name: 'Alpha Gadget',
			price: 500,
			quantity: 2,
			total_amount: 1000,
		})

		// Seed an expense
		memDb.getTable('expenses').push({
			id: 'ex_rep_1',
			tenant_id: 'tenant_branches',
			title: 'Branch Rent',
			amount: 300,
			category: 'Rent',
			created_at: new Date().toISOString(),
		})

		const loginRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'lead@multiloc.com', password: 'Pass123!Secure' })
		assert.strictEqual(loginRes.status, 200)
		tenantToken = loginRes.body.token
	})

	describe('1. Multi-Branch Management & Quotas', () => {
		it('should list branches (automatically initializes primary default branch if none)', async () => {
			const res = await request(app)
				.get('/api/branches')
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.ok(Array.isArray(res.body))
			assert.strictEqual(res.body.length, 1)
			assert.strictEqual(res.body[0].isDefault, true)
		})

		it('should create a second branch within plan allowance', async () => {
			const res = await request(app)
				.post('/api/branches')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					name: 'Kandy Outlet',
					code: 'KDY',
					address: 'Dalada Veediya, Kandy',
					phone: '+94 81 223 4567',
				})
			assert.strictEqual(res.status, 201)
			assert.strictEqual(res.body.name, 'Kandy Outlet')
			assert.strictEqual(res.body.code, 'KDY')
		})

		it('should reject third branch creation when maxBranches limit (2) is reached', async () => {
			const res = await request(app)
				.post('/api/branches')
				.set('Authorization', `Bearer ${tenantToken}`)
				.send({
					name: 'Galle Flagship',
					code: 'GLE',
				})
			assert.strictEqual(res.status, 403)
			assert.match(res.body.message, /Branch limit reached/i)
		})
	})

	describe('2. Financial Analytics & Reporting Engine', () => {
		it('should calculate revenue, net profit, and payment breakdown accurately', async () => {
			const res = await request(app)
				.get('/api/reports/summary')
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.revenue, 1100)
			assert.strictEqual(res.body.sales, 1)
			assert.strictEqual(res.body.expensesTotal, 300)
			assert.strictEqual(res.body.netProfit, 800) // 1100 - 300
			assert.strictEqual(res.body.paymentBreakdown.card, 1100)
			assert.ok(res.body.topProducts.length > 0)
			assert.strictEqual(res.body.topProducts[0].name, 'Alpha Gadget')
		})

		it('should export sales records in standard CSV format', async () => {
			const res = await request(app)
				.get('/api/reports/export')
				.set('Authorization', `Bearer ${tenantToken}`)
			assert.strictEqual(res.status, 200)
			assert.match(res.headers['content-type'], /text\/csv/i)
			assert.ok(res.text.includes('"Sale ID"'))
			assert.ok(res.text.includes('"s_rep_1"'))
			assert.ok(res.text.includes('1100.00'))
		})
	})
})

