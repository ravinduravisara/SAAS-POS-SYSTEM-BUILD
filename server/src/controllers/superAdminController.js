const { getSupabase } = require('../config/db')

function mapTenant(tenant) {
	if (!tenant) return tenant
	return {
		id: tenant.id,
		name: tenant.name,
		slug: tenant.slug,
		email: tenant.email,
		plan: tenant.plan,
		status: tenant.status,
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

		const { data: subscriptions, error: subscriptionError } = await db
			.from('subscriptions')
			.select('*')
		if (subscriptionError) throw subscriptionError

		const result = await Promise.all((tenants || []).map(async (tenant) => {
			const { count, error } = await db
				.from('users')
				.select('id', { count: 'exact', head: true })
				.eq('tenant_id', tenant.id)
			if (error) throw error

			const latestSub = (subscriptions || [])
				.filter((subscription) => subscription.tenant_id === tenant.id)
				.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null

			return {
				...mapTenant(tenant),
				userCount: count || 0,
				subscription: mapSubscription(latestSub),
			}
		}))

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

		const { data: users, error: usersError } = await db
			.from('users')
			.select('id, name, email, role, tenant_id, created_at')
			.eq('tenant_id', tenantId)
			.order('created_at', { ascending: false })
		if (usersError) throw usersError

		const { data: subscriptions, error: subscriptionError } = await db
			.from('subscriptions')
			.select('*')
			.eq('tenant_id', tenantId)
			.order('created_at', { ascending: false })
			.limit(1)
		if (subscriptionError) throw subscriptionError

		const { count: productCount } = await db.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
		const { count: saleCount } = await db.from('sales').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
		const { count: customerCount } = await db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)

		res.json({
			...mapTenant(tenant),
			users: (users || []).map((user) => ({
				id: user.id,
				tenantId: user.tenant_id,
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.created_at,
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
		const { data: tenant, error } = await db
			.from('tenants')
			.insert({
				name: payload.name || payload.storeName || 'Tenant',
				slug: payload.slug || `${String(payload.name || payload.storeName || 'tenant').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
				email: String(payload.email || '').toLowerCase(),
				plan: payload.plan || 'starter',
				status: payload.status || 'active',
				trial_ends_at: payload.trialEndsAt || null,
			})
			.select()
			.single()
		if (error) throw error

		const { error: settingsError } = await db
			.from('tenant_settings')
			.insert({
				tenant_id: tenant.id,
				store_name: payload.name || payload.storeName || 'Tenant',
				currency: payload.settings?.currency || 'LKR',
				tax_rate: Number(payload.settings?.taxRate || 0),
				timezone: payload.settings?.timezone || 'Asia/Colombo',
			})
		if (settingsError) throw settingsError

		res.status(201).json(mapTenant(tenant))
	} catch (err) {
		next(err)
	}
}

async function updateTenantStatus(req, res, next) {
	try {
		const db = getSupabase()
		const { status } = req.body || {}
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
		const { plan } = req.body || {}
		const { error: tenantError } = await db.from('tenants').update({ plan }).eq('id', req.params.id)
		if (tenantError) throw tenantError
		const { error: subscriptionError } = await db.from('subscriptions').update({ plan }).eq('tenant_id', req.params.id)
		if (subscriptionError) throw subscriptionError

		const { data, error } = await db.from('tenants').select('*').eq('id', req.params.id).single()
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
		const { data: subscriptions, error: subscriptionError } = await db
			.from('subscriptions')
			.select('*')
			.order('created_at', { ascending: false })
		if (subscriptionError) throw subscriptionError

		const tenantIds = [...new Set((subscriptions || []).map((subscription) => subscription.tenant_id))]
		let tenantMap = {}
		if (tenantIds.length > 0) {
			const { data: tenants, error: tenantError } = await db
				.from('tenants')
				.select('id, name, slug')
				.in('id', tenantIds)
			if (tenantError) throw tenantError
			tenantMap = Object.fromEntries((tenants || []).map((tenant) => [tenant.id, tenant]))
		}

		res.json((subscriptions || []).map((subscription) => ({
			...mapSubscription(subscription),
			tenant: tenantMap[subscription.tenant_id] || null,
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

async function stats(req, res, next) {
	try {
		const db = getSupabase()
		const { count: total, error: totalError } = await db.from('tenants').select('id', { count: 'exact', head: true })
		if (totalError) throw totalError

		const { count: active, error: activeError } = await db.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active')
		if (activeError) throw activeError

		const { count: trial, error: trialError } = await db.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'trial')
		if (trialError) throw trialError

		const { data: subs, error: subsError } = await db.from('subscriptions').select('amount').eq('status', 'active')
		if (subsError) throw subsError
		const monthlyRevenue = (subs || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)

		res.json({ totalTenants: total || 0, active: active || 0, trial: trial || 0, monthlyRevenue })
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
	deleteTenant,
	listSubscriptions,
	updateSubscription,
	stats,
}