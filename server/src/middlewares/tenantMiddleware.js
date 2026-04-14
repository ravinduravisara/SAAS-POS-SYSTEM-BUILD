const { getSupabase } = require('../config/db')

async function tenantMiddleware(req, res, next) {
	if (!req.user?.tenantId) {
		return res.status(403).json({ message: 'Tenant access required' })
	}

	const { data: tenant, error } = await getSupabase()
		.from('tenants')
		.select('id, name, slug, plan, status, trial_ends_at, feature_overrides')
		.eq('id', req.user.tenantId)
		.single()

	if (error || !tenant) {
		return res.status(404).json({ message: 'Tenant not found' })
	}
	if (tenant.status === 'suspended') {
		return res.status(403).json({ message: 'Account suspended. Please contact support.' })
	}
	if (tenant.status === 'cancelled') {
		return res.status(403).json({ message: 'Subscription cancelled.' })
	}

	req.tenant = {
		id: tenant.id,
		name: tenant.name,
		slug: tenant.slug,
		plan: tenant.plan,
		status: tenant.status,
		featureOverrides: tenant.feature_overrides || {},
		trialEndsAt: tenant.trial_ends_at,
	}
	next()
}

module.exports = tenantMiddleware