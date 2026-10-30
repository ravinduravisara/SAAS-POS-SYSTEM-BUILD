const { resolveEffectiveFeatures } = require('../utils/featureResolver')

function planMiddleware(featureKey) {
	return (req, res, next) => {
		const plan = req.tenant?.plan || 'starter'
		const features = resolveEffectiveFeatures(plan, req.tenant?.featureOverrides || {})
		if (!features[featureKey]) {
			return res.status(403).json({
				error: {
					code: 'FEATURE_DISABLED',
					feature: featureKey,
					message: `The module '${featureKey}' is disabled for this workspace or not included in the '${plan}' plan.`,
				},
				message: `This feature requires a higher plan or module activation. Current plan: ${plan}`,
			})
		}
		next()
	}
}

module.exports = planMiddleware
