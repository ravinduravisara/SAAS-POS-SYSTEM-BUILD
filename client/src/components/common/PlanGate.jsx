import { usePlan } from '../../hooks/usePlan'

export default function PlanGate({ feature, children, fallback = null }) {
	const { can } = usePlan()
	return can(feature) ? children : fallback ?? (
		<div className="card">
			<h3 className="h3">Upgrade required</h3>
			<div className="muted">This feature is not available on your current plan.</div>
		</div>
	)
}