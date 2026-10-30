import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import { formatCurrency } from '../../utils/formatCurrency'

export default function PaymentModal({ open, total, onClose, onConfirm }) {
	const [prevTotal, setPrevTotal] = useState(total)
	const [method, setMethod] = useState('cash')
	const [paid, setPaid] = useState(total || 0)
	const [cashPart, setCashPart] = useState(0)
	const [cardPart, setCardPart] = useState(0)
	const [submitting, setSubmitting] = useState(false)

	if (total !== prevTotal) {
		setPrevTotal(total)
		setPaid(total)
		setCashPart(Math.round(total / 2))
		setCardPart(total - Math.round(total / 2))
	}

	const numericTotal = Number(total || 0)
	const numericPaid = method === 'split'
		? Number(cashPart || 0) + Number(cardPart || 0)
		: Number(paid || 0)
	const change = Math.max(0, numericPaid - numericTotal)
	const isInsufficient = numericPaid < numericTotal

	async function handleConfirm() {
		if (isInsufficient) return
		setSubmitting(true)
		try {
			await onConfirm?.({
				method,
				paid: numericPaid,
				splits: method === 'split' ? [
					{ method: 'cash', amount: Number(cashPart || 0) },
					{ method: 'card', amount: Number(cardPart || 0) },
				] : undefined,
			})
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Modal title="Complete Payment" open={open} onClose={onClose}>
			<div className="stack">
				<div className="row row--space" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '4px' }}>
					<span className="bold">Total Due:</span>
					<span className="bold" style={{ fontSize: '1.3rem', color: '#0f766e' }}>
						{formatCurrency(numericTotal)}
					</span>
				</div>

				<label className="field">
					<span className="field__label">Payment Method</span>
					<select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
						<option value="cash">Cash</option>
						<option value="card">Card Terminal</option>
						<option value="bank_transfer">Bank Transfer / QR</option>
						<option value="split">Split Payment (Cash + Card)</option>
					</select>
				</label>

				{method === 'split' ? (
					<div className="stack" style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '4px' }}>
						<Input
							label="Cash Amount"
							type="number"
							step="0.01"
							value={cashPart}
							onChange={(e) => setCashPart(e.target.value)}
						/>
						<Input
							label="Card Amount"
							type="number"
							step="0.01"
							value={cardPart}
							onChange={(e) => setCardPart(e.target.value)}
						/>
						<div className="row row--space">
							<span className="muted">Combined Tendered:</span>
							<strong>{formatCurrency(numericPaid)}</strong>
						</div>
					</div>
				) : (
					<Input
						label="Amount Tendered / Paid"
						type="number"
						step="0.01"
						value={paid}
						onChange={(e) => setPaid(e.target.value)}
					/>
				)}

				<div className="row row--space" style={{ padding: '0.5rem 0' }}>
					<span className="muted">Change Due:</span>
					<strong style={{ fontSize: '1.1rem', color: change > 0 ? '#166534' : 'inherit' }}>
						{formatCurrency(change)}
					</strong>
				</div>

				{isInsufficient ? (
					<div className="muted" style={{ color: '#dc2626', fontSize: '0.85rem' }}>
						Amount tendered is less than total due.
					</div>
				) : null}

				<div className="row row--space" style={{ marginTop: '0.5rem' }}>
					<Button variant="secondary" onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={isInsufficient || submitting}>
						{submitting ? 'Processing...' : 'Confirm Checkout'}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
