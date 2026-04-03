import { useSelector } from 'react-redux'

export default function useProducts() {
	const items = useSelector((state) => state.products.items)
	const status = useSelector((state) => state.products.status)
	const error = useSelector((state) => state.products.error)
	return { items, status, error }
}
