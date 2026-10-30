const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890'
process.env.USE_MOCK_DB = 'true'

const app = require('../src/app')
const { getInMemoryDb } = require('../src/db/inMemoryDb')
const { hashPassword } = require('../src/utils/password')

describe('PHASE 5: Industry Modules (Restaurant, Repairs, Salon, HRM) Tests', () => {
	let memDb
	let enterpriseToken
	let starterToken

	before(async () => {
		memDb = getInMemoryDb()
		memDb.reset()

		// 1. Enterprise Tenant with all industry features
		memDb.getTable('tenants').push({
			id: 'tenant_ent',
			name: 'Mega Enterprises Conglomerate',
			slug: 'mega-ent',
			email: 'corp@megaent.com',
			plan: 'enterprise',
			status: 'active',
			created_at: new Date().toISOString(),
		})

		memDb.getTable('users').push({
			id: 'u_ent_admin',
			tenant_id: 'tenant_ent',
			name: 'General Director',
			email: 'director@megaent.com',
			password: hashPassword('Pass123!Secure'),
			role: 'admin',
		})

		// 2. Starter Tenant (restricted features)
		memDb.getTable('tenants').push({
			id: 'tenant_start',
			name: 'Corner Kiosk',
			slug: 'kiosk',
			email: 'kiosk@example.com',
			plan: 'starter',
			status: 'active',
			feature_overrides: {},
			created_at: new Date().toISOString(),
		})

		memDb.getTable('users').push({
			id: 'u_start_user',
			tenant_id: 'tenant_start',
			name: 'Kiosk Clerk',
			email: 'clerk@kiosk.com',
			password: hashPassword('Pass123!Secure'),
			role: 'cashier',
		})

		// Seed spare part product for repairs inventory test
		memDb.getTable('products').push({
			id: 'p_screen_oem',
			tenant_id: 'tenant_ent',
			name: 'OEM OLED Display Glass',
			sku: 'SP-SCR-01',
			price: 12000,
			stock: 10,
			created_at: new Date().toISOString(),
		})

		// Login Enterprise Admin
		const entLoginRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'director@megaent.com', password: 'Pass123!Secure' })
		enterpriseToken = entLoginRes.body.token

		// Login Starter User
		const startLoginRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'clerk@kiosk.com', password: 'Pass123!Secure' })
		starterToken = startLoginRes.body.token
	})

	describe('1. Restaurant & Table Management + KDS', () => {
		let tableId
		let orderId

		it('should list restaurant tables and auto-seed standard floor plan', async () => {
			const res = await request(app)
				.get('/api/restaurant/tables')
				.set('Authorization', `Bearer ${enterpriseToken}`)

			assert.strictEqual(res.statusCode, 200)
			assert.ok(Array.isArray(res.body))
			assert.ok(res.body.length >= 5)
			assert.strictEqual(res.body[0].status, 'available')
			tableId = res.body[0].id
		})

		it('should place an order, mark table as occupied, and create kitchen ticket', async () => {
			const res = await request(app)
				.post('/api/restaurant/orders')
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					tableId,
					tableNumber: 'T1',
					waiterName: 'Samantha',
					items: [
						{ name: 'Crispy Calamari', quantity: 2, price: 1200 },
						{ name: 'Sparkling Lemonade', quantity: 1, price: 450 },
					],
				})

			assert.strictEqual(res.statusCode, 201)
			assert.strictEqual(res.body.status, 'placed')
			assert.strictEqual(res.body.total, 2850)
			orderId = res.body.id

			// Verify table is occupied
			const tablesRes = await request(app)
				.get('/api/restaurant/tables')
				.set('Authorization', `Bearer ${enterpriseToken}`)
			const targetTable = tablesRes.body.find((t) => t.id === tableId)
			assert.strictEqual(targetTable.status, 'occupied')
		})

		it('should query active orders on Kitchen Display System (KDS)', async () => {
			const res = await request(app)
				.get('/api/restaurant/kitchen/orders')
				.set('Authorization', `Bearer ${enterpriseToken}`)

			assert.strictEqual(res.statusCode, 200)
			const found = res.body.find((o) => o.id === orderId)
			assert.ok(found)
			assert.strictEqual(found.status, 'placed')
			assert.strictEqual(found.items.length, 2)
		})

		it('should progress order to paid and automatically free up table to available', async () => {
			const res = await request(app)
				.put(`/api/restaurant/orders/${orderId}/status`)
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({ status: 'paid' })

			assert.strictEqual(res.statusCode, 200)
			assert.strictEqual(res.body.status, 'paid')

			// Verify table is released
			const tablesRes = await request(app)
				.get('/api/restaurant/tables')
				.set('Authorization', `Bearer ${enterpriseToken}`)
			const targetTable = tablesRes.body.find((t) => t.id === tableId)
			assert.strictEqual(targetTable.status, 'available')
		})
	})

	describe('2. Service Center & Repair Job Cards', () => {
		let jobId

		it('should create a repair job card with diagnostic notes and cost calculation', async () => {
			const res = await request(app)
				.post('/api/repairs/jobs')
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					customerName: 'Ruwan Rajapakse',
					customerPhone: '0719876543',
					deviceModel: 'iPhone 14 Pro',
					serialNumber: 'IMEI-9876543210',
					problemDescription: 'Cracked screen display & touch sensor unresponsive',
					technicianName: 'Kasun Tech',
					laborCost: 4500,
					spareParts: [{ productId: 'p_screen_oem', name: 'OEM OLED Display Glass', quantity: 1, price: 12000 }],
				})

			assert.strictEqual(res.statusCode, 201)
			assert.strictEqual(res.body.customer_name, 'Ruwan Rajapakse')
			assert.strictEqual(res.body.status, 'received')
			assert.strictEqual(Number(res.body.total_cost), 16500)
			jobId = res.body.id
		})

		it('should complete repair job, consume spare parts from inventory, and log adjustment', async () => {
			const res = await request(app)
				.put(`/api/repairs/jobs/${jobId}/status`)
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					status: 'completed',
					partsToConsume: [{ productId: 'p_screen_oem', quantity: 1 }],
				})

			assert.strictEqual(res.statusCode, 200)
			assert.strictEqual(res.body.status, 'completed')

			// Verify product inventory decremented from 10 to 9
			const prod = memDb.getTable('products').find((p) => p.id === 'p_screen_oem')
			assert.strictEqual(prod.stock, 9)

			// Verify inventory adjustment log created
			const logs = memDb.getTable('inventory_logs')
			const log = logs.find((l) => l.product_id === 'p_screen_oem')
			assert.ok(log)
			assert.strictEqual(log.delta, -1)
			assert.ok(log.note.includes(`Repair Job #${jobId}`))
		})
	})

	describe('3. Salon Appointments & Booking Conflict Prevention', () => {
		let stylistId
		let serviceId
		let appointmentId

		it('should list salon stylists and services', async () => {
			const stylRes = await request(app)
				.get('/api/salon/stylists')
				.set('Authorization', `Bearer ${enterpriseToken}`)
			assert.strictEqual(stylRes.statusCode, 200)
			assert.ok(stylRes.body.length > 0)
			stylistId = stylRes.body[0].id

			const servRes = await request(app)
				.get('/api/salon/services')
				.set('Authorization', `Bearer ${enterpriseToken}`)
			assert.strictEqual(servRes.statusCode, 200)
			assert.ok(servRes.body.length > 0)
			serviceId = servRes.body[0].id
		})

		it('should book a confirmed appointment slot', async () => {
			const res = await request(app)
				.post('/api/salon/appointments')
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					customerName: 'Ananya Sharma',
					customerPhone: '0772233445',
					stylistId,
					serviceId,
					appointmentDate: '2026-11-15',
					appointmentTime: '14:00',
				})

			assert.strictEqual(res.statusCode, 201)
			assert.strictEqual(res.body.status, 'confirmed')
			assert.strictEqual(res.body.customerName, 'Ananya Sharma')
			appointmentId = res.body.id
		})

		it('should reject double-booking the same stylist at the same time slot with 409 Conflict', async () => {
			const res = await request(app)
				.post('/api/salon/appointments')
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					customerName: 'Deepika Kumar',
					customerPhone: '0779988776',
					stylistId,
					serviceId,
					appointmentDate: '2026-11-15',
					appointmentTime: '14:00',
				})

			assert.strictEqual(res.statusCode, 409)
			const errMsg = res.body.message || res.body.error?.message || ''
			assert.ok(errMsg.includes('already booked'))
		})

		it('should update appointment status to in_progress and completed', async () => {
			const res = await request(app)
				.put(`/api/salon/appointments/${appointmentId}/status`)
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({ status: 'completed' })

			assert.strictEqual(res.statusCode, 200)
			assert.strictEqual(res.body.status, 'completed')
		})
	})

	describe('4. HRM & Attendance & Payroll Processing', () => {
		let employeeId
		let payrollId

		it('should list employees and register attendance', async () => {
			const empsRes = await request(app)
				.get('/api/hrm/employees')
				.set('Authorization', `Bearer ${enterpriseToken}`)
			assert.strictEqual(empsRes.statusCode, 200)
			assert.ok(empsRes.body.length > 0)
			employeeId = empsRes.body[0].id

			const attRes = await request(app)
				.post('/api/hrm/attendance')
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					employeeId,
					date: '2026-10-30',
					checkIn: '08:30',
					status: 'present',
				})
			assert.strictEqual(attRes.statusCode, 201)
			assert.strictEqual(attRes.body.status, 'present')
		})

		it('should generate monthly payroll with decimal-safe salary calculations', async () => {
			const res = await request(app)
				.post('/api/hrm/payroll/generate')
				.set('Authorization', `Bearer ${enterpriseToken}`)
				.send({
					employeeId,
					monthYear: '2026-10',
					bonus: 5000,
					deductions: 2500,
				})

			assert.strictEqual(res.statusCode, 201)
			assert.ok(Array.isArray(res.body))
			assert.strictEqual(res.body.length, 1)

			const slip = res.body[0]
			assert.strictEqual(slip.status, 'draft')
			assert.strictEqual(slip.bonus, 5000)
			assert.strictEqual(slip.deductions, 2500)
			// Base salary 55,000 + 5,000 - 2,500 = 57,500
			assert.strictEqual(slip.netSalary, 57500)
			payrollId = slip.id
		})

		it('should mark payroll record as paid', async () => {
			const res = await request(app)
				.put(`/api/hrm/payroll/${payrollId}/pay`)
				.set('Authorization', `Bearer ${enterpriseToken}`)

			assert.strictEqual(res.statusCode, 200)
			assert.strictEqual(res.body.status, 'paid')
			assert.ok(res.body.payment_date)
		})
	})

	describe('5. Plan Entitlement Gate Protection', () => {
		it('should deny Starter plan tenant access to Restaurant module with 403 Forbidden', async () => {
			const res = await request(app)
				.get('/api/restaurant/tables')
				.set('Authorization', `Bearer ${starterToken}`)

			assert.strictEqual(res.statusCode, 403)
			assert.strictEqual(res.body.error?.code, 'FEATURE_DISABLED')
			assert.strictEqual(res.body.error?.feature, 'restaurant.core')
		})

		it('should deny Starter plan tenant access to Repairs module with 403 Forbidden', async () => {
			const res = await request(app)
				.get('/api/repairs/jobs')
				.set('Authorization', `Bearer ${starterToken}`)

			assert.strictEqual(res.statusCode, 403)
			assert.strictEqual(res.body.error?.code, 'FEATURE_DISABLED')
			assert.strictEqual(res.body.error?.feature, 'repairs.jobCards')
		})

		it('should deny Starter plan tenant access to Salon module with 403 Forbidden', async () => {
			const res = await request(app)
				.get('/api/salon/appointments')
				.set('Authorization', `Bearer ${starterToken}`)

			assert.strictEqual(res.statusCode, 403)
			assert.strictEqual(res.body.error?.code, 'FEATURE_DISABLED')
			assert.strictEqual(res.body.error?.feature, 'salon.appointments')
		})

		it('should deny Starter plan tenant access to HRM module with 403 Forbidden', async () => {
			const res = await request(app)
				.get('/api/hrm/employees')
				.set('Authorization', `Bearer ${starterToken}`)

			assert.strictEqual(res.statusCode, 403)
			assert.strictEqual(res.body.error?.code, 'FEATURE_DISABLED')
			assert.strictEqual(res.body.error?.feature, 'hrm.core')
		})
	})
})
