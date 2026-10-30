const { getSupabase } = require('../config/db')
const { PLAN_FEATURES } = require('../../../shared/constants/plans')
const {
	FEATURE_DEFINITIONS,
	FEATURE_CATEGORIES,
	INDUSTRY_PRESETS,
} = require('../../../shared/constants/features')
const {
	resolveEffectiveFeatures,
	validateFeatureDependencies,
	getPresetFeatures,
} = require('../utils/featureResolver')
const { hashPassword } = require('../utils/password')
const { round } = require('../../../shared/utils/decimal')

const PLAN_PRICES = {
	starter: 9.99,
	pro: 29.99,
	enterprise: 99.99,
}

const VALID_STATUSES = new Set(['active', 'trial', 'past_due', 'suspended', 'cancelled', 'expired', 'archived'])

function mapTenant(tenant) {
	if (!tenant) return tenant
	return {
		id: tenant.id,
		name: tenant.name,
		slug: tenant.slug,
		email: tenant.email,
		businessType: tenant.business_type || 'retail',
		registrationNumber: tenant.registration_number || '',
		phone: tenant.phone || '',
		address: tenant.address || '',
		plan: tenant.plan || 'starter',
		status: tenant.status || 'trial',
		featureOverrides: tenant.feature_overrides || {},
		maxUsers: tenant.max_users !== undefined ? tenant.max_users : (PLAN_FEATURES[tenant.plan]?.maxUsers ?? 2),
		maxProducts: tenant.max_products !== undefined ? tenant.max_products : (PLAN_FEATURES[tenant.plan]?.maxProducts ?? 100),
		maxBranches: tenant.max_branches !== undefined ? tenant.max_branches : 1,
		trialEndsAt: tenant.trial_ends_at,
		createdAt: tenant.created_at,
	}
}

function mapSubscription(subscription) {
	if (!subscription) return subscription
	return {
		id: subscription.id,
		tenantId: subscription.tenant_id,
		plan: subscription.plan,
		status: subscription.status,
		amount: Number(subscription.amount || 0),
		startedAt: subscription.started_at,
		renewsAt: subscription.renews_at,
		createdAt: subscription.created_at,
	}
}

async function listTenants(req, res, next) {
	try {
		const db = getSupabase()
		const { data: tenants, error: tenantError } = await db
			.from('tenants')
			.select('*')
			.order('created_at', { ascending: false })
		if (tenantError) throw tenantError

		const { data: subscriptions } = await db.from('subscriptions').select('*')
		const { data: users } = await db.from('users').select('id, tenant_id')

		const result = (tenants || []).map((tenant) => {
			const tenantUsers = (users || []).filter((u) => u.tenant_id === tenant.id)
			const latestSub = (subscriptions || [])
				.filter((s) => s.tenant_id === tenant.id)
				.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null

			return {
				...mapTenant(tenant),
				planFeatures: resolveEffectiveFeatures(tenant.plan, tenant.feature_overrides || {}),
				userCount: tenantUsers.length,
				subscription: mapSubscription(latestSub),
			}
		})

		res.json(result)
	} catch (err) {
		next(err)
	}
}

async function getTenant(req, res, next) {
	try {
		const db = getSupabase()
		const tenantId = req.params.id

		const { data: tenant, error: tenantError } = await db
			.from('tenants')
			.select('*')
			.eq('id', tenantId)
			.single()
		if (tenantError || !tenant) {
			return res.status(404).json({ message: 'Tenant not found' })
		}

		const { data: settings } = await db
			.from('tenant_settings')
			.select('*')
			.eq('tenant_id', tenantId)
			.maybeSingle()

		const { data: users } = await db
			.from('users')
			.select('id, name, email, role, tenant_id, created_at')
			.eq('tenant_id', tenantId)
			.order('created_at', { ascending: false })

		const { data: subscriptions } = await db
			.from('subscriptions')
			.select('*')
			.eq('tenant_id', tenantId)
			.order('created_at', { ascending: false })
			.limit(1)

		const { count: productCount } = await db
			.from('products')
			.select('id', { count: 'exact', head: true })
			.eq('tenant_id', tenantId)
		const { count: saleCount } = await db
			.from('sales')
			.select('id', { count: 'exact', head: true })
			.eq('tenant_id', tenantId)
		const { count: customerCount } = await db
			.from('customers')
			.select('id', { count: 'exact', head: true })
			.eq('tenant_id', tenantId)

		res.json({
			...mapTenant(tenant),
			settings: settings || { currency: 'LKR', tax_rate: 0, store_name: tenant.name },
			planFeatures: resolveEffectiveFeatures(tenant.plan, tenant.feature_overrides || {}),
			users: (users || []).map((u) => ({
				id: u.id,
				name: u.name,
				email: u.email,
				role: u.role,
				createdAt: u.created_at,
			})),
			subscription: mapSubscription(subscriptions?.[0] || null),
			usage: {
				productCount: productCount || 0,
				saleCount: saleCount || 0,
				customerCount: customerCount || 0,
				userCount: (users || []).length,
			},
		})
	} catch (err) {
		next(err)
	}
}

async function createTenant(req, res, next) {
	try {
		const db = getSupabase()
		const payload = req.body || {}
		const plan = PLAN_FEATURES[payload.plan] ? payload.plan : 'starter'
		const status = VALID_STATUSES.has(payload.status) ? payload.status : 'trial'
		const tenantEmail = String(payload.email || '').trim().toLowerCase()
		const adminEmail = String(payload.adminEmail || tenantEmail).trim().toLowerCase()
		const adminPassword = String(payload.adminPassword || '')

		if (!tenantEmail) {
			return res.status(400).json({ message: 'Business email is required' })
		}
		if (!adminEmail) {
			return res.status(400).json({ message: 'Admin email is required' })
		}
		if (!adminPassword || adminPassword.length < 8) {
			return res.status(400).json({ message: 'Admin password must be at least 8 characters long' })
		}

		// Check duplicate tenant email
		const { data: existingTenant } = await db
			.from('tenants')
			.select('id')
			.eq('email', tenantEmail)
			.maybeSingle()
		if (existingTenant) {
			return res.status(409).json({ message: 'A business with this email already exists' })
		}

		// Industry Preset support
		let featureOverrides = payload.featureOverrides || {}
		if (payload.industryPreset && INDUSTRY_PRESETS[payload.industryPreset]) {
			featureOverrides = {
				...getPresetFeatures(payload.industryPreset),
				...featureOverrides,
			}
		}

		const trialDays = parseInt(payload.trialDays, 10) || 14
		const trialEndsAt = payload.trialEndsAt || new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()

		const slug = payload.slug || `${String(payload.name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`

		const { data: tenant, error } = await db
			.from('tenants')
			.insert({
				name: payload.name || 'New Business',
				slug,
				email: tenantEmail,
				business_type: payload.businessType || payload.industryPreset || 'retail',
				registration_number: payload.registrationNumber || '',
				phone: payload.phone || '',
				address: payload.address || '',
				plan,
				status,
				trial_ends_at: status === 'trial' ? trialEndsAt : null,
				feature_overrides: featureOverrides,
				max_users: payload.maxUsers !== undefined ? parseInt(payload.maxUsers, 10) : (PLAN_FEATURES[plan]?.maxUsers ?? 2),
				max_products: payload.maxProducts !== undefined ? parseInt(payload.maxProducts, 10) : (PLAN_FEATURES[plan]?.maxProducts ?? 100),
				max_branches: payload.maxBranches !== undefined ? parseInt(payload.maxBranches, 10) : 1,
			})
			.select()
			.single()
		if (error) throw error

		// Create Settings
		await db.from('tenant_settings').insert({
			tenant_id: tenant.id,
			store_name: payload.name || 'New Business',
			currency: payload.currency || 'LKR',
			tax_rate: Number(payload.taxRate || 0),
			timezone: payload.timezone || 'Asia/Colombo',
		})

		// Create Subscription
		await db.from('subscriptions').insert({
			tenant_id: tenant.id,
			plan,
			status: status === 'active' ? 'active' : 'trial',
			amount: PLAN_PRICES[plan] || PLAN_PRICES.starter,
			started_at: new Date().toISOString(),
		})

		// Create Tenant Admin User
		await db.from('users').insert({
			tenant_id: tenant.id,
			name: payload.adminName || 'Business Owner',
			email: adminEmail,
			password: hashPassword(adminPassword),
			role: 'admin',
		})

		res.status(201).json({
			...mapTenant(tenant),
			planFeatures: resolveEffectiveFeatures(plan, featureOverrides),
		})
	} catch (err) {
		next(err)
	}
}

async function updateTenantStatus(req, res, next) {
	try {
		const db = getSupabase()
		const status = req.body?.status
		if (!VALID_STATUSES.has(status)) {
			return res.status(400).json({ message: `Invalid status. Valid values: ${[...VALID_STATUSES].join(', ')}` })
		}

		const { data, error } = await db
			.from('tenants')
			.update({ status })
			.eq('id', req.params.id)
			.select()
			.single()
		if (error) throw error

		res.json(mapTenant(data))
	} catch (err) {
		next(err)
	}
}

async function updateTenantPlan(req, res, next) {
	try {
		const db = getSupabase()
		const requestedPlan = req.body?.plan
		const plan = PLAN_FEATURES[requestedPlan] ? requestedPlan : 'starter'

		const { data: currentTenant } = await db
			.from('tenants')
			.select('id, plan, feature_overrides')
			.eq('id', req.params.id)
			.single()
		if (!currentTenant) return res.status(404).json({ message: 'Tenant not found' })

		const { data, error } = await db
			.from('tenants')
			.update({ plan })
			.eq('id', req.params.id)
			.select()
			.single()
		if (error) throw error

		// Sync latest subscription
		await db.from('subscriptions').update({ plan, amount: PLAN_PRICES[plan] }).eq('tenant_id', req.params.id)

		res.json({
			...mapTenant(data),
			planFeatures: resolveEffectiveFeatures(data.plan, data.feature_overrides || {}),
		})
	} catch (err) {
		next(err)
	}
}

async function updateTenantFeatures(req, res, next) {
	try {
		const db = getSupabase()
		const tenantId = req.params.id
		const { data: tenant } = await db.from('tenants').select('*').eq('id', tenantId).single()
		if (!tenant) return res.status(404).json({ message: 'Tenant not found' })

		let proposedOverrides = { ...(tenant.feature_overrides || {}) }

		// If applying industry preset
		if (req.body?.industryPreset && INDUSTRY_PRESETS[req.body.industryPreset]) {
			proposedOverrides = {
				...proposedOverrides,
				...getPresetFeatures(req.body.industryPreset),
			}
		}

		if (req.body?.featureOverrides && typeof req.body.featureOverrides === 'object') {
			proposedOverrides = {
				...proposedOverrides,
				...req.body.featureOverrides,
			}
		}

		// Validate dependencies
		const depCheck = validateFeatureDependencies(proposedOverrides)

		const { data, error } = await db
			.from('tenants')
			.update({ feature_overrides: proposedOverrides })
			.eq('id', tenantId)
			.select()
			.single()
		if (error) throw error

		res.json({
			...mapTenant(data),
			planFeatures: resolveEffectiveFeatures(data.plan, data.feature_overrides || {}),
			dependencyWarnings: depCheck.errors,
		})
	} catch (err) {
		next(err)
	}
}

async function updateTenantLimits(req, res, next) {
	try {
		const db = getSupabase()
		const payload = {}
		if (req.body.maxUsers !== undefined) payload.max_users = parseInt(req.body.maxUsers, 10)
		if (req.body.maxProducts !== undefined) payload.max_products = parseInt(req.body.maxProducts, 10)
		if (req.body.maxBranches !== undefined) payload.max_branches = parseInt(req.body.maxBranches, 10)

		const { data, error } = await db
			.from('tenants')
			.update(payload)
			.eq('id', req.params.id)
			.select()
			.single()
		if (error) throw error
		res.json(mapTenant(data))
	} catch (err) {
		next(err)
	}
}

async function deleteTenant(req, res, next) {
	try {
		const { error } = await getSupabase().from('tenants').delete().eq('id', req.params.id)
		if (error) throw error
		res.json({ ok: true })
	} catch (err) {
		next(err)
	}
}

async function listSubscriptions(req, res, next) {
	try {
		const db = getSupabase()
		const { data: subscriptions, error } = await db
			.from('subscriptions')
			.select('*')
			.order('created_at', { ascending: false })
		if (error) throw error

		const tenantIds = [...new Set((subscriptions || []).map((s) => s.tenant_id))]
		const { data: tenants } = await db.from('tenants').select('id, name, slug').in('id', tenantIds)
		const tenantMap = Object.fromEntries((tenants || []).map((t) => [t.id, t]))

		res.json((subscriptions || []).map((s) => ({
			...mapSubscription(s),
			tenant: tenantMap[s.tenant_id] || null,
		})))
	} catch (err) {
		next(err)
	}
}

async function updateSubscription(req, res, next) {
	try {
		const payload = {}
		if (req.body?.plan !== undefined) payload.plan = req.body.plan
		if (req.body?.status !== undefined) payload.status = req.body.status
		if (req.body?.renewsAt !== undefined) payload.renews_at = req.body.renewsAt
		if (req.body?.amount !== undefined) payload.amount = Number(req.body.amount || 0)

		const { data, error } = await getSupabase()
			.from('subscriptions')
			.update(payload)
			.eq('id', req.params.id)
			.select()
			.single()
		if (error) throw error
		res.json(mapSubscription(data))
	} catch (err) {
		next(err)
	}
}

async function getFeatureDefinitions(req, res) {
	res.json({
		categories: FEATURE_CATEGORIES,
		features: FEATURE_DEFINITIONS,
		presets: INDUSTRY_PRESETS,
	})
}

async function stats(req, res, next) {
	try {
		const db = getSupabase()
		const { count: total } = await db.from('tenants').select('id', { count: 'exact', head: true })
		const { count: active } = await db.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active')
		const { count: trial } = await db.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'trial')
		const { count: suspended } = await db.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'suspended')
		const { count: expired } = await db.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'expired')

		const { data: subs } = await db.from('subscriptions').select('amount, status').eq('status', 'active')
		const monthlyRevenue = (subs || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
		const annualRevenue = round(monthlyRevenue * 12, 2)

		const { count: totalUsers } = await db.from('users').select('id', { count: 'exact', head: true })
		const { count: totalProducts } = await db.from('products').select('id', { count: 'exact', head: true })
		const { count: totalSales } = await db.from('sales').select('id', { count: 'exact', head: true })

		res.json({
			totalTenants: total || 0,
			active: active || 0,
			trial: trial || 0,
			suspended: suspended || 0,
			expired: expired || 0,
			monthlyRevenue: round(monthlyRevenue, 2),
			annualRevenue,
			totalUsers: totalUsers || 0,
			totalProducts: totalProducts || 0,
			totalSales: totalSales || 0,
		})
	} catch (err) {
		next(err)
	}
}

module.exports = {
	listTenants,
	getTenant,
	createTenant,
	updateTenantStatus,
	updateTenantPlan,
	updateTenantFeatures,
	updateTenantLimits,
	deleteTenant,
	listSubscriptions,
	updateSubscription,
	getFeatureDefinitions,
	stats,
}
