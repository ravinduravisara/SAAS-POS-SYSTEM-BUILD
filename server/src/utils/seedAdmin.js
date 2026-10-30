const { getSupabase } = require('../config/db')
const { hashPassword } = require('./password')

async function seedInitialData() {
	const db = getSupabase()

	// 1. Seed Super Admin
	const superAdminPassword = process.env.INITIAL_SUPERADMIN_PASSWORD || 'SuperAdmin@Secure2026'
	const superAdminEmail = (process.env.INITIAL_SUPERADMIN_EMAIL || 'superadmin@posplatform.com').toLowerCase()

	const { data: existingSA } = await db.from('super_admins').select('id').eq('email', superAdminEmail).maybeSingle()
	if (!existingSA) {
		await db.from('super_admins').insert({
			id: 'sa_master',
			email: superAdminEmail,
			password: hashPassword(superAdminPassword),
		})
	}

	// 2. Seed Default Demo Tenant
	const demoTenantEmail = 'owner@demo.com'
	const { data: existingTenant } = await db.from('tenants').select('id').eq('email', demoTenantEmail).maybeSingle()
	let tenantId = 'tenant_demo'
	if (!existingTenant) {
		const { data: newTenant } = await db.from('tenants').insert({
			id: tenantId,
			name: 'Demo Supermarket',
			slug: 'demo-supermarket',
			email: demoTenantEmail,
			plan: 'pro',
			status: 'active',
			feature_overrides: {},
		})
		if (newTenant && newTenant.id) tenantId = newTenant.id

		await db.from('tenant_settings').upsert({
			tenant_id: tenantId,
			store_name: 'Demo Supermarket',
			currency: 'LKR',
			tax_rate: 0.08,
			timezone: 'Asia/Colombo',
		}, { onConflict: 'tenant_id' })

		await db.from('subscriptions').insert({
			id: 'sub_demo_active',
			tenant_id: tenantId,
			plan: 'pro',
			status: 'active',
			amount: 29.99,
		})

		const demoAdminPassword = process.env.INITIAL_DEMO_ADMIN_PASSWORD || 'DemoAdmin@Secure2026'
		await db.from('users').insert({
			id: 'u_demo_admin',
			tenant_id: tenantId,
			name: 'Store Manager',
			email: 'admin@demo.com',
			password: hashPassword(demoAdminPassword),
			role: 'admin',
		})

		// Seed initial categories
		await db.from('categories').insert([
			{ id: 'cat_groceries', tenant_id: tenantId, name: 'Groceries' },
			{ id: 'cat_beverages', tenant_id: tenantId, name: 'Beverages' },
			{ id: 'cat_bakery', tenant_id: tenantId, name: 'Bakery' },
		])

		// Seed initial products
		await db.from('products').insert([
			{ id: 'prod_milk', tenant_id: tenantId, name: 'Fresh Milk 1L', sku: 'MILK-001', price: 420.00, stock: 50, category_id: 'cat_beverages' },
			{ id: 'prod_bread', tenant_id: tenantId, name: 'Whole Wheat Bread', sku: 'BREAD-001', price: 210.00, stock: 30, category_id: 'cat_bakery' },
			{ id: 'prod_rice', tenant_id: tenantId, name: 'Basmati Rice 5kg', sku: 'RICE-001', price: 1850.00, stock: 25, category_id: 'cat_groceries' },
			{ id: 'prod_tea', tenant_id: tenantId, name: 'Ceylon Black Tea 400g', sku: 'TEA-001', price: 650.00, stock: 40, category_id: 'cat_beverages' },
		])
	}
}

module.exports = { seedInitialData }

