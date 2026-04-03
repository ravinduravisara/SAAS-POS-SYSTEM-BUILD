import { formatCurrency } from '../../utils/formatCurrency'

export default function RevenueCard({ revenue = 0, sales = 0 }) {
	return (
		<div className="card">
			<h3 className="h3">Summary</h3>
			<div className="row row--space">
				<span className="muted">Revenue</span>
				<strong>{formatCurrency(revenue)}</strong>
			</div>
			<div className="row row--space">
				<span className="muted">Sales</span>
				<strong>{sales}</strong>
			</div>
		</div>
	)
}
