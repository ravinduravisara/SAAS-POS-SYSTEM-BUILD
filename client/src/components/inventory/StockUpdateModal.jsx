import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'

export default function StockUpdateModal({ open, product, onClose, onSave }) {
	const [stock, setStock] = useState('')

	useEffect(() => {
		setStock(product?.stock ?? '')
	}, [product])

	return (
		<Modal title="Update Stock" open={open} onClose={onClose}>
			<div className="stack">
				<div className="muted">{product?.name || ''}</div>
				<Input
					label="Stock"
					type="number"
					value={stock}
					onChange={(e) => setStock(e.target.value)}
				/>
				<Button
					onClick={() =>
						onSave?.({
						productId: product?.id,
						stock: Number(stock || 0),
					})
					}
				>
					Save
				</Button>
			</div>
		</Modal>
	)
}
