const { getSupabase } = require('../config/db')
const { generateToken } = require('../utils/generateToken')
const { resolvePlanFeatures } = require('../utils/planFeatures')
const { hashPassword, verifyPassword, isHashedPassword } = require('../utils/password')

async function login({ email, password }) {
	const db = getSupabase()
	const normalizedEmail = String(email || '').toLowerCase()

	const { data: sa, error: superAdminError } = await db
		.from('super_admins')
		.select('*')
		.eq('email', normalizedEmail)
		.maybeSingle()
	if (superAdminError) throw superAdminError

	if (sa && verifyPassword(password, sa.password)) {
		if (!isHashedPassword(sa.password)) {
			await db.from('super_admins').update({ password: hashPassword(password) }).eq('id', sa.id)
		}
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
	if (!verifyPassword(password, user.password)) {
		const err = new Error('Invalid credentials')
		err.status = 401
		throw err
	}

	if (!isHashedPassword(user.password)) {
		await db.from('users').update({ password: hashPassword(password) }).eq('id', user.id)
	}

	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('id, name, slug, plan, status, feature_overrides')
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
		planFeatures: resolvePlanFeatures(tenant.plan, tenant.feature_overrides || {}),
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
		.select('id, name, slug, plan, status, trial_ends_at, feature_overrides')
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
		planFeatures: resolvePlanFeatures(tenant.plan, tenant.feature_overrides || {}),
	}
}

module.exports = { login, me }
