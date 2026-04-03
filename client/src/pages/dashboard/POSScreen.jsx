import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../../components/pos/ProductCard.jsx'
import CartItem from '../../components/pos/CartItem.jsx'
import CheckoutPanel from '../../components/pos/CheckoutPanel.jsx'
import Loader from '../../components/common/Loader.jsx'
import { fetchProducts } from '../../store/slices/productSlice'
import { addToCart, removeFromCart, setQuantity } from '../../store/slices/cartSlice'

export default function POSScreen() {
	const dispatch = useDispatch()
	const { items: products, status } = useSelector((state) => state.products)
	const cartItems = useSelector((state) => state.cart.items)

	useEffect(() => {
		dispatch(fetchProducts())
	}, [dispatch])

	return (
		<div className="pos">
			<div className="pos__products">
				{status === 'loading' ? <Loader /> : null}
				<div className="grid grid--3">
					{products.map((p) => (
						<ProductCard key={p.id} product={p} onAdd={() => dispatch(addToCart(p))} />
					))}
				</div>
			</div>

			<div className="pos__cart">
				<div className="card">
					<h3 className="h3">Cart</h3>
					{cartItems.length === 0 ? (
						<div className="muted">No items yet.</div>
					) : (
						<div className="stack">
							{cartItems.map((item) => (
								<CartItem
									key={item.productId}
									item={item}
									onRemove={() => dispatch(removeFromCart(item.productId))}
									onQty={(q) => dispatch(setQuantity({ productId: item.productId, quantity: q }))}
								/>
							))}
						</div>
					)}
				</div>
				<CheckoutPanel />
			</div>
		</div>
	)
}
