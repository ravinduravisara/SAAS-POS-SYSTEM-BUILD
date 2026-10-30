import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { calculateTotals } from '../../utils/calculateTotals'
import { formatCurrency } from '../../utils/formatCurrency'
import Button from '../common/Button.jsx'
import PaymentModal from './PaymentModal.jsx'
import ReceiptPreview from './ReceiptPreview.jsx'
import salesService from '../../services/salesService'
import customerService from '../../services/customerService'
import { generateReceipt } from '../../utils/generateReceipt'
import { clearCart } from '../../store/slices/cartSlice'

export default function CheckoutPanel() {
	const dispatch = useDispatch()
	const items = useSelector((state) => state.cart.items)
	const [customers, setCustomers] = useState([])
	const [selectedCustomerId, setSelectedCustomerId] = useState('')
	const [discountValue, setDiscountValue] = useState(0)
	const [discountType, setDiscountType] = useState('fixed') // 'fixed' or 'percentage'
	const [payOpen, setPayOpen] = useState(false)
	const [receiptOpen, setReceiptOpen] = useState(false)
	const [receiptText, setReceiptText] = useState('')
	const [checkoutError, setCheckoutError] = useState(null)

	useEffect(() => {
		let active = true
		customerService
			.getAll()
			.then((data) => {
				if (active) setCustomers(data)
			})
			.catch(() => {})
		return () => {
			active = false
		}
	}, [])

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'F9' && items.length > 0) {
				e.preventDefault()
				setPayOpen(true)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [items.length])

	const totals = useMemo(() => {
		const base = calculateTotals(items)
		let discountAmount = 0
		const numDiscount = Number(discountValue || 0)
		if (numDiscount > 0) {
			if (discountType === 'percentage') {
				discountAmount = Math.round((base.subtotal * (numDiscount / 100)) * 100) / 100
			} else {
				discountAmount = Math.min(base.subtotal, numDiscount)
			}
		}
		const finalTotal = Math.max(0, base.subtotal - discountAmount)
		return {
			...base,
			discountAmount,
			total: finalTotal,
		}
	}, [items, discountValue, discountType])

	const saleItems = useMemo(
		() =>
			items.map((i) => ({
				productId: i.productId,
				name: i.name,
				price: i.price,
				quantity: i.quantity,
			})),
		[items],
	)

	async function confirmPayment(payment) {
		setCheckoutError(null)
		try {
			const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
			const sale = await salesService.createSale(
				{
					items: saleItems,
					customerId: selectedCustomerId || null,
					discount: discountValue > 0 ? { type: discountType, value: Number(discountValue) } : null,
					payment,
				},
				idempotencyKey,
			)

			setReceiptText(generateReceipt({ items, totals: sale.totals || totals }))
			dispatch(clearCart())
			setSelectedCustomerId('')
			setDiscountValue(0)
			setPayOpen(false)
			setReceiptOpen(true)
			return sale
		} catch (err) {
			setCheckoutError(err?.response?.data?.message || err?.message || 'Checkout failed')
			throw err
		}
	}

	return (
		<>
			<div className="card stack">
				<h3 className="h3" style={{ margin: 0 }}>Checkout</h3>

				{checkoutError ? (
					<div className="card card--error" style={{ color: '#dc2626', fontSize: '0.85rem' }}>
						{checkoutError}
					</div>
				) : null}

				<div>
					<label className="label" style={{ fontSize: '0.8rem' }}>Customer</label>
					<select
						className="input"
						value={selectedCustomerId}
						onChange={(e) => setSelectedCustomerId(e.target.value)}
					>
						<option value="">Walk-in Customer</option>
						{customers.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name} {c.phone ? `(${c.phone})` : ''}
							</option>
						))}
					</select>
				</div>

				<div className="row" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
					<div style={{ flex: 1 }}>
						<label className="label" style={{ fontSize: '0.8rem' }}>Discount</label>
						<input
							className="input"
							type="number"
							min="0"
							placeholder="0"
							value={discountValue || ''}
							onChange={(e) => setDiscountValue(Number(e.target.value || 0))}
						/>
					</div>
					<select
						className="input"
						style={{ width: '80px' }}
						value={discountType}
						onChange={(e) => setDiscountType(e.target.value)}
					>
						<option value="fixed">Fixed</option>
						<option value="percentage">%</option>
					</select>
				</div>

				<div className="divider" style={{ borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />

				<div className="row row--space">
					<span className="muted">Subtotal</span>
					<span>{formatCurrency(totals.subtotal)}</span>
				</div>

				{totals.discountAmount > 0 ? (
					<div className="row row--space" style={{ color: '#166534' }}>
						<span>Discount</span>
						<span>-{formatCurrency(totals.discountAmount)}</span>
					</div>
				) : null}

				<div className="row row--space">
					<span className="muted">Items Count</span>
					<span>{totals.itemsCount}</span>
				</div>

				<div className="row row--space" style={{ fontSize: '1.2rem' }}>
					<strong>Total</strong>
					<strong style={{ color: '#0f766e' }}>{formatCurrency(totals.total)}</strong>
				</div>

				<div className="row" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
					{items.length > 0 ? (
						<Button
							variant="secondary"
							onClick={() => dispatch(clearCart())}
							style={{ flex: 1 }}
						>
							Clear
						</Button>
					) : null}
					<Button
						disabled={items.length === 0}
						onClick={() => setPayOpen(true)}
						style={{ flex: 2 }}
					>
						Pay Now
					</Button>
				</div>
			</div>

			<PaymentModal
				open={payOpen}
				total={totals.total}
				onClose={() => setPayOpen(false)}
				onConfirm={confirmPayment}
			/>
			<ReceiptPreview
				open={receiptOpen}
				receiptText={receiptText}
				onClose={() => setReceiptOpen(false)}
			/>
		</>
	)
}
