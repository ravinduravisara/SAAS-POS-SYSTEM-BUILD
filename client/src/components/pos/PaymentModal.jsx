import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'

export default function PaymentModal({ open, total, onClose, onConfirm }) {
	const [method, setMethod] = useState('cash')
	const [paid, setPaid] = useState(total)

	return (
		<Modal title="Payment" open={open} onClose={onClose}>
			<div className="stack">
				<label className="field">
					<span className="field__label">Method</span>
					<select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
						<option value="cash">cash</option>
						<option value="card">card</option>
						<option value="qr">qr</option>
					</select>
				</label>

				<Input
					label="Paid"
					type="number"
					step="0.01"
					value={paid}
					onChange={(e) => setPaid(e.target.value)}
				/>

				<div className="row row--space">
					<div className="muted">Total: {total}</div>
					<Button onClick={() => onConfirm?.({ method, paid: Number(paid || 0) })}>
						Confirm
					</Button>
				</div>
			</div>
		</Modal>
	)
}
