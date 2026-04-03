import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import { formatCurrency } from '../../utils/formatCurrency'

export default function CartItem({ item, onRemove, onQty }) {
	return (
		<div className="row row--space">
			<div>
				<div className="h3">{item.name}</div>
				<div className="muted">{formatCurrency(item.price)}</div>
			</div>
			<div className="row">
				<Input
					aria-label="Quantity"
					type="number"
					min={1}
					value={item.quantity}
					onChange={(e) => onQty?.(Number(e.target.value))}
				/>
				<Button variant="secondary" onClick={onRemove}>
					Remove
				</Button>
			</div>
		</div>
	)
}
