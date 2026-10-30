import { useSelector } from 'react-redux'

const LEGACY_MAP = {
	inventoryManagement: 'inventory.core',
	purchaseManagement: 'purchases.core',
	expenseManagement: 'finance.expenses',
	reports: 'reports.advanced',
	accounting: 'finance.accounting',
	hrm: 'hrm.core',
}

export function usePlan() {
	const planFeatures = useSelector((s) => s.auth.planFeatures)
	const tenant = useSelector((s) => s.auth.tenant)

	function can(feature) {
		if (!feature) return true
		if (planFeatures?.[feature] !== undefined) {
			return Boolean(planFeatures[feature])
		}
		const mappedKey = LEGACY_MAP[feature]
		if (mappedKey && planFeatures?.[mappedKey] !== undefined) {
			return Boolean(planFeatures[mappedKey])
		}
		return false
	}

	return {
		plan: tenant?.plan || 'starter',
		can,
		planFeatures,
	}
}
