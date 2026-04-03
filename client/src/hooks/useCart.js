import { useSelector } from 'react-redux'
import { calculateTotals } from '../utils/calculateTotals'

export default function useCart() {
	const items = useSelector((state) => state.cart.items)
	const totals = calculateTotals(items)
	return { items, totals }
}
