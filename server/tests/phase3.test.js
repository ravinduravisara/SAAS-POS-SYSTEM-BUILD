const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890'
process.env.USE_MOCK_DB = 'true'

const app = require('../src/app')
const { getInMemoryDb } = require('../src/db/inMemoryDb')
const { hashPassword } = require('../src/utils/password')

describe('PHASE 3: SaaS Control Center & Feature Activation Engine Tests', () => {
	let memDb
	let superAdminToken
	let createdTenantId
	let tenantAdminToken

	before(async () => {
		memDb = getInMemoryDb()
		memDb.reset()

		// Setup Super Admin
		memDb.getTable('super_admins').length = 0
		memDb.getTable('super_admins').push({
			id: 'sa_phase3',
			email: 'superadmin.phase3@posplatform.com',
			password: hashPassword('SuperMasterPass2026!'),
		})

		const saLogin = await request(app)
			.post('/api/auth/login')
			.send({ email: 'superadmin.phase3@posplatform.com', password: 'SuperMasterPass2026!' })
		assert.strictEqual(saLogin.status, 200)
		superAdminToken = saLogin.body.token
	})

	describe('1. Feature Registry & Presets Catalog', () => {
		it('should return all feature definitions and industry presets', async () => {
			const res = await request(app)
				.get('/api/super-admin/features')
				.set('Authorization', `Bearer ${superAdminToken}`)
			assert.strictEqual(res.status, 200)
			assert.ok(Array.isArray(res.body.features))
			assert.ok(res.body.features.length >= 10)
			assert.ok(res.body.presets.restaurant)
			assert.ok(res.body.presets.supermarket)
		})

		it('should return platform analytics with MRR and tenant distribution', async () => {
			const res = await request(app)
				.get('/api/super-admin/stats')
				.set('Authorization', `Bearer ${superAdminToken}`)
			assert.strictEqual(res.status, 200)
			assert.ok('monthlyRevenue' in res.body)
			assert.ok('annualRevenue' in res.body)
		})
	})

	describe('2. Commercial Business Onboarding', () => {
		it('should onboard a new restaurant business with industry preset and custom limits', async () => {
			const res = await request(app)
				.post('/api/super-admin/tenants')
				.set('Authorization', `Bearer ${superAdminToken}`)
				.send({
					name: 'Golden Fork Bistro',
					industryPreset: 'restaurant',
					email: 'billing@goldenfork.com',
					phone: '+94 11 987 6543',
					plan: 'enterprise',
					status: 'active',
					currency: 'USD',
					adminName: 'Chef Gordon',
					adminEmail: 'gordon@goldenfork.com',
					adminPassword: 'Password123!Secure',
					maxUsers: 10,
					maxProducts: 200,
				})

			assert.strictEqual(res.status, 201)
			assert.strictEqual(res.body.name, 'Golden Fork Bistro')
			assert.strictEqual(res.body.businessType, 'restaurant')
			assert.strictEqual(res.body.status, 'active')
			createdTenantId = res.body.id

			// Restaurant preset must have activated restaurant.core and restaurant.kitchenDisplay
			assert.strictEqual(res.body.planFeatures['restaurant.core'], true)
			assert.strictEqual(res.body.planFeatures['restaurant.kitchenDisplay'], true)

			// Login as newly created tenant admin
			const tenantLogin = await request(app)
				.post('/api/auth/login')
				.send({ email: 'gordon@goldenfork.com', password: 'Password123!Secure' })
			assert.strictEqual(tenantLogin.status, 200)
			tenantAdminToken = tenantLogin.body.token
		})
	})

	describe('3. Dynamic Feature Activation & Route Gating (Scenario D)', () => {
		it('initially tenant can access purchases route because purchases.core is enabled', async () => {
			const res = await request(app)
				.get('/api/purchases')
				.set('Authorization', `Bearer ${tenantAdminToken}`)
			assert.strictEqual(res.status, 200)
		})

		it('Super Admin disables purchases.core for this specific tenant', async () => {
			const toggleRes = await request(app)
				.put(`/api/super-admin/tenants/${createdTenantId}/features`)
				.set('Authorization', `Bearer ${superAdminToken}`)
				.send({
					featureOverrides: {
						'purchases.core': false,
					},
				})
			assert.strictEqual(toggleRes.status, 200)
			assert.strictEqual(toggleRes.body.planFeatures['purchases.core'], false)
		})

		it('direct API call to /api/purchases is now rejected with 403 FEATURE_DISABLED', async () => {
			const res = await request(app)
				.get('/api/purchases')
				.set('Authorization', `Bearer ${tenantAdminToken}`)
			assert.strictEqual(res.status, 403)
			assert.strictEqual(res.body.error.code, 'FEATURE_DISABLED')
		})

		it('Super Admin re-enables purchases.core and access is immediately restored', async () => {
			const restoreRes = await request(app)
				.put(`/api/super-admin/tenants/${createdTenantId}/features`)
				.set('Authorization', `Bearer ${superAdminToken}`)
				.send({
					featureOverrides: {
						'purchases.core': true,
					},
				})
			assert.strictEqual(restoreRes.status, 200)
			assert.strictEqual(restoreRes.body.planFeatures['purchases.core'], true)

			// Access is restored
			const accessRes = await request(app)
				.get('/api/purchases')
				.set('Authorization', `Bearer ${tenantAdminToken}`)
			assert.strictEqual(accessRes.status, 200)
		})
	})

	describe('4. Business Status Lifecycle & Enforcement (Scenario E)', () => {
		it('Super Admin suspends tenant account', async () => {
			const res = await request(app)
				.put(`/api/super-admin/tenants/${createdTenantId}/status`)
				.set('Authorization', `Bearer ${superAdminToken}`)
				.send({ status: 'suspended' })
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.status, 'suspended')
		})

		it('suspended tenant requests are rejected by backend', async () => {
			const res = await request(app)
				.get('/api/products')
				.set('Authorization', `Bearer ${tenantAdminToken}`)
			assert.strictEqual(res.status, 403)
			assert.match(res.body.message, /suspended/i)
		})

		it('Super Admin reactivates tenant and normal operations resume', async () => {
			const reactivateRes = await request(app)
				.put(`/api/super-admin/tenants/${createdTenantId}/status`)
				.set('Authorization', `Bearer ${superAdminToken}`)
				.send({ status: 'active' })
			assert.strictEqual(reactivateRes.status, 200)
			assert.strictEqual(reactivateRes.body.status, 'active')

			const accessRes = await request(app)
				.get('/api/products')
				.set('Authorization', `Bearer ${tenantAdminToken}`)
			assert.strictEqual(accessRes.status, 200)
		})
	})

	describe('5. Commercial Tenant Lifecycle & Cascade Deletion', () => {
		it('Super Admin can permanently delete tenant workspace with cascade cleanup', async () => {
			const res = await request(app)
				.delete(`/api/super-admin/tenants/${createdTenantId}`)
				.set('Authorization', `Bearer ${superAdminToken}`)
			assert.strictEqual(res.status, 200)
			assert.strictEqual(res.body.ok, true)
		})

		it('fetching deleted tenant returns 404 Not Found', async () => {
			const res = await request(app)
				.get(`/api/super-admin/tenants/${createdTenantId}`)
				.set('Authorization', `Bearer ${superAdminToken}`)
			assert.strictEqual(res.status, 404)
		})

		it('rejects deletion of non-existent tenant with 404', async () => {
			const res = await request(app)
				.delete('/api/super-admin/tenants/tenant_nonexistent_999')
				.set('Authorization', `Bearer ${superAdminToken}`)
			assert.strictEqual(res.status, 404)
		})
	})
})
