const { PLAN_FEATURES } = require('../../../shared/constants/plans')

function sanitizeFeatureOverrides(plan, overrides = {}) {
	const base = PLAN_FEATURES[plan] || PLAN_FEATURES.starter
	const sanitized = {}

	for (const [key, value] of Object.entries(overrides || {})) {
		if (typeof base[key] !== 'boolean') continue
		sanitized[key] = Boolean(value)
	}

	return sanitized
}

function resolvePlanFeatures(plan, overrides = {}) {
	const base = PLAN_FEATURES[plan] || PLAN_FEATURES.starter
	const safeOverrides = sanitizeFeatureOverrides(plan, overrides)
	return { ...base, ...safeOverrides }
}

module.exports = { resolvePlanFeatures, sanitizeFeatureOverrides }
