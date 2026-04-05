module.exports = {
	STARTER: 'starter',
	PRO: 'pro',
	ENTERPRISE: 'enterprise',
	PLAN_FEATURES: {
		starter: { maxUsers: 2, maxProducts: 100, reports: false, multiLocation: false, price: 9.99 },
		pro: { maxUsers: 10, maxProducts: 1000, reports: true, multiLocation: false, price: 29.99 },
		enterprise: { maxUsers: -1, maxProducts: -1, reports: true, multiLocation: true, price: 99.99 },
	},
}