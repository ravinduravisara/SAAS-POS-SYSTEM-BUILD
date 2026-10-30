const { resolveEffectiveFeatures, validateFeatureDependencies } = require('./featureResolver')

function sanitizeFeatureOverrides(plan, overrides = {}) {
	const sanitized = {}
	for (const [key, value] of Object.entries(overrides || {})) {
		sanitized[key] = Boolean(value)
	}
	return sanitized
}

function resolvePlanFeatures(plan, overrides = {}) {
	return resolveEffectiveFeatures(plan, overrides)
}

module.exports = {
	resolvePlanFeatures,
	sanitizeFeatureOverrides,
	resolveEffectiveFeatures,
	validateFeatureDependencies,
}
