const { resolvePlanFeatures } = require('../utils/planFeatures')

function planMiddleware(feature) {
	return (req, res, next) => {
		const plan = req.tenant?.plan || 'starter'
		const features = resolvePlanFeatures(plan, req.tenant?.featureOverrides || {})
		if (!features[feature]) {
			return res.status(403).json({ message: `This feature requires a higher plan. Current: ${plan}` })
		}
		next()
	}
}

module.exports = planMiddleware