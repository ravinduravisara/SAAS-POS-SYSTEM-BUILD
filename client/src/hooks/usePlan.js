import { useSelector } from 'react-redux'

export function usePlan() {
	const planFeatures = useSelector((s) => s.auth.planFeatures)
	const tenant = useSelector((s) => s.auth.tenant)
	return {
		plan: tenant?.plan,
		can: (feature) => Boolean(planFeatures?.[feature]),
		planFeatures,
	}
}