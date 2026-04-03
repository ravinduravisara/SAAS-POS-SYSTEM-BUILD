import { useSelector } from 'react-redux'
import { calculateTotals } from '../../utils/calculateTotals'
import { formatCurrency } from '../../utils/formatCurrency'
import Button from '../common/Button.jsx'
import PaymentModal from './PaymentModal.jsx'
import ReceiptPreview from './ReceiptPreview.jsx'
import { useMemo, useState } from 'react'
import salesService from '../../services/salesService'
import { generateReceipt } from '../../utils/generateReceipt'
import { useDispatch } from 'react-redux'
import { clearCart } from '../../store/slices/cartSlice'

export default function CheckoutPanel() {
	const dispatch = useDispatch()
	const items = useSelector((state) => state.cart.items)
	const totals = calculateTotals(items)
	const [payOpen, setPayOpen] = useState(false)
	const [receiptOpen, setReceiptOpen] = useState(false)
	const [receiptText, setReceiptText] = useState('')

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
		const sale = await salesService.createSale({ items: saleItems, totals, payment })
		setReceiptText(generateReceipt({ items, totals: sale.totals || totals }))
		dispatch(clearCart())
		setPayOpen(false)
		setReceiptOpen(true)
		return sale
	}

	return (
		<>
			<div className="card">
				<h3 className="h3">Checkout</h3>
				<div className="row row--space">
					<span className="muted">Subtotal</span>
					<span>{formatCurrency(totals.subtotal)}</span>
				</div>
				<div className="row row--space">
					<span className="muted">Items</span>
					<span>{totals.itemsCount}</span>
				</div>
				<div className="row row--space">
					<strong>Total</strong>
					<strong>{formatCurrency(totals.total)}</strong>
				</div>
				<Button disabled={items.length === 0} onClick={() => setPayOpen(true)}>
					Pay
				</Button>
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
