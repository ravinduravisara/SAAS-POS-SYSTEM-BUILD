import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'

export default function StockUpdateModal({ open, product, onClose, onSave }) {
	const [prevProduct, setPrevProduct] = useState(product)
	const [stock, setStock] = useState(product?.stock ?? '')
	const [reason, setReason] = useState('Stock Count / Reconciliation')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	if (product !== prevProduct) {
		setPrevProduct(product)
		setStock(product?.stock ?? '')
		setReason('Stock Count / Reconciliation')
		setError('')
	}

	async function handleSubmit(e) {
		e.preventDefault()
		const num = Number(stock)
		if (Number.isNaN(num) || num < 0) {
			setError('Stock must be a non-negative number')
			return
		}
		setSaving(true)
		try {
			await onSave?.({
				productId: product?.id,
				stock: Math.floor(num),
				reason,
			})
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to update stock')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Modal
			title={`Adjust Stock: ${product?.name || ''}`}
			open={open}
			onClose={onClose}
		>
			<form className="stack" onSubmit={handleSubmit}>
				{error && (
					<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
						{error}
					</div>
				)}

				<div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
					<div style={{ fontSize: '0.85rem', color: '#64748b' }}>Current Recorded Stock</div>
					<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
						{product?.stock ?? 0} units
					</div>
					{product?.sku && (
						<div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
							SKU: <span style={{ fontFamily: 'monospace' }}>{product.sku}</span>
						</div>
					)}
				</div>

				<Input
					label="New Stock Count"
					type="number"
					min="0"
					step="1"
					value={stock}
					onChange={(e) => setStock(e.target.value)}
					required
				/>

				<div>
					<label className="label">Adjustment Reason</label>
					<select
						className="input"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
					>
						<option value="Stock Count / Reconciliation">Stock Count / Physical Reconciliation</option>
						<option value="Damaged / Expired Goods">Damaged / Expired Goods</option>
						<option value="Internal Use / Shrinkage">Internal Store Consumption</option>
						<option value="Manual Correction">Data Entry Correction</option>
					</select>
				</div>

				<div className="row row--space" style={{ marginTop: '1rem' }}>
					<Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
						Cancel
					</Button>
					<Button type="submit" disabled={saving}>
						{saving ? 'Updating...' : 'Confirm Stock Adjustment'}
					</Button>
				</div>
			</form>
		</Modal>
	)
}
