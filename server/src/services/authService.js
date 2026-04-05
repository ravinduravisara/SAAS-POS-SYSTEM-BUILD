const { getSupabase } = require('../config/db')
const { generateToken } = require('../utils/generateToken')

const PLAN_FEATURES = {
	starter: { maxUsers: 2, maxProducts: 100, reports: false, multiLocation: false },
	pro: { maxUsers: 10, maxProducts: 1000, reports: true, multiLocation: false },
	enterprise: { maxUsers: -1, maxProducts: -1, reports: true, multiLocation: true },
}

const PLAN_PRICES = { starter: 9.99, pro: 29.99, enterprise: 99.99 }

async function login({ email, password }) {
	const db = getSupabase()
	const normalizedEmail = String(email || '').toLowerCase()

	const { data: sa, error: superAdminError } = await db
		.from('super_admins')
		.select('*')
		.eq('email', normalizedEmail)
		.maybeSingle()
	if (superAdminError) throw superAdminError

	if (sa && sa.password === password) {
		const token = generateToken({ userId: sa.id, role: 'superadmin' })
		return {
			token,
			isSuperAdmin: true,
			user: { id: sa.id, email: sa.email, role: 'superadmin', name: 'Super Admin' },
		}
	}

	const { data: users, error } = await db
		.from('users')
		.select('id, tenant_id, name, email, password, role')
		.eq('email', normalizedEmail)
		.limit(1)
	if (error || !users || users.length === 0) {
		const err = new Error('Invalid credentials')
		err.status = 401
		throw err
	}

	const user = users[0]
	if (user.password !== password) {
		const err = new Error('Invalid credentials')
		err.status = 401
		throw err
	}

	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('id, name, slug, plan, status')
		.eq('id', user.tenant_id)
		.single()
	if (tenantError || !tenant) {
		const err = new Error('Tenant not found')
		err.status = 404
		throw err
	}

	if (tenant.status === 'suspended') {
		const err = new Error('Account suspended')
		err.status = 403
		throw err
	}

	const { data: subscriptions, error: subscriptionError } = await db
		.from('subscriptions')
		.select('*')
		.eq('tenant_id', tenant.id)
		.order('created_at', { ascending: false })
		.limit(1)
	if (subscriptionError) throw subscriptionError
	const subscription = subscriptions?.[0] || null

	const token = generateToken({ userId: user.id, tenantId: tenant.id, role: user.role })

	return {
		token,
		isSuperAdmin: false,
		user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: tenant.id },
		tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, status: tenant.status },
		subscription,
		planFeatures: PLAN_FEATURES[tenant.plan] || PLAN_FEATURES.starter,
	}
}

async function register({ name, email, password, storeName, plan = 'starter' }) {
	const db = getSupabase()
	const normalizedEmail = String(email || '').toLowerCase()

	const { data: existing, error: existingError } = await db
		.from('users')
		.select('id')
		.eq('email', normalizedEmail)
		.maybeSingle()
	if (existingError) throw existingError
	if (existing) {
		const err = new Error('Email already registered')
		err.status = 409
		throw err
	}

	const slug = `${String(storeName || 'store').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`
	const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.insert({ name: storeName, slug, email: normalizedEmail, plan, status: 'trial', trial_ends_at: trialEndsAt })
		.select()
		.single()
	if (tenantError) throw new Error(`Failed to create tenant: ${tenantError.message}`)

	const { error: settingsError } = await db
		.from('tenant_settings')
		.insert({ tenant_id: tenant.id, store_name: storeName, currency: 'LKR', tax_rate: 0 })
	if (settingsError) throw settingsError

	const { data: subscriptionRows, error: subscriptionError } = await db
		.from('subscriptions')
		.insert({ tenant_id: tenant.id, plan, status: 'trial', amount: PLAN_PRICES[plan] || PLAN_PRICES.starter })
		.select()
		.limit(1)
	if (subscriptionError) throw subscriptionError
	const subscription = subscriptionRows?.[0] || null

	const { data: user, error: userError } = await db
		.from('users')
		.insert({ tenant_id: tenant.id, name, email: normalizedEmail, password, role: 'admin' })
		.select()
		.single()
	if (userError) throw userError

	const token = generateToken({ userId: user.id, tenantId: tenant.id, role: 'admin' })

	return {
		token,
		isSuperAdmin: false,
		user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: tenant.id },
		tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, status: tenant.status },
		subscription,
		planFeatures: PLAN_FEATURES[plan] || PLAN_FEATURES.starter,
	}
}

async function me(userId, tenantId) {
	const db = getSupabase()

	if (!tenantId) {
		const { data: user, error } = await db.from('super_admins').select('id, email').eq('id', userId).single()
		if (error) throw error
		return { user: user ? { ...user, role: 'superadmin', name: 'Super Admin' } : null, tenant: null, subscription: null }
	}

	const { data: user, error: userError } = await db
		.from('users')
		.select('id, name, email, role, tenant_id')
		.eq('id', userId)
		.eq('tenant_id', tenantId)
		.single()
	if (userError) throw userError

	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('id, name, slug, plan, status, trial_ends_at')
		.eq('id', tenantId)
		.single()
	if (tenantError) throw tenantError

	const { data: subscriptions, error: subscriptionError } = await db
		.from('subscriptions')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
		.limit(1)
	if (subscriptionError) throw subscriptionError

	const subscription = subscriptions?.[0] || null
	return {
		user: { ...user, tenantId: user.tenant_id },
		tenant: {
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
			plan: tenant.plan,
			status: tenant.status,
			trialEndsAt: tenant.trial_ends_at,
		},
		subscription,
		planFeatures: PLAN_FEATURES[tenant.plan] || PLAN_FEATURES.starter,
	}
}

module.exports = { login, register, me }
