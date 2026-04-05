const { PLAN_FEATURES } = require('../../../shared/constants/plans')

function planMiddleware(feature) {
	return (req, res, next) => {
		const plan = req.tenant?.plan || 'starter'
		const features = PLAN_FEATURES[plan] || PLAN_FEATURES.starter
		if (!features[feature]) {
			return res.status(403).json({ message: `This feature requires a higher plan. Current: ${plan}` })
		}
		next()
	}
}

module.exports = planMiddleware