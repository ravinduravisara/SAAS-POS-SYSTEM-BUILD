import Button from '../common/Button.jsx'
import { formatCurrency } from '../../utils/formatCurrency'

export default function ProductCard({ product, onAdd }) {
	return (
		<div className="card">
			<div className="row row--space">
				<div>
					<div className="h3">{product.name}</div>
					<div className="muted">{formatCurrency(product.price)}</div>
				</div>
				<Button onClick={onAdd}>Add</Button>
			</div>
		</div>
	)
}
