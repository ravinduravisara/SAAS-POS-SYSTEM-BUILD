import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../../components/pos/ProductCard.jsx'
import CartItem from '../../components/pos/CartItem.jsx'
import CheckoutPanel from '../../components/pos/CheckoutPanel.jsx'
import Loader from '../../components/common/Loader.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { fetchProducts } from '../../store/slices/productSlice'
import { addToCart, removeFromCart, setQuantity, clearCart, loadCart } from '../../store/slices/cartSlice'
import categoryService from '../../services/categoryService'

export default function POSScreen() {
	const dispatch = useDispatch()
	const { items: products, status } = useSelector((state) => state.products)
	const cartItems = useSelector((state) => state.cart.items)

	const [categories, setCategories] = useState([])
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [barcodeInput, setBarcodeInput] = useState('')
	const [heldSales, setHeldSales] = useState([])
	const [scanFeedback, setScanFeedback] = useState(null)

	useEffect(() => {
		dispatch(fetchProducts())
		categoryService.getAll().then(setCategories).catch(() => {})
	}, [dispatch])

	function handleBarcodeSubmit(e) {
		e.preventDefault()
		const code = barcodeInput.trim().toLowerCase()
		if (!code) return

		const matched = products.find(
			(p) =>
				(p.barcode && p.barcode.toLowerCase() === code) ||
				(p.sku && p.sku.toLowerCase() === code) ||
				p.id.toLowerCase() === code,
		)

		if (matched) {
			dispatch(addToCart(matched))
			setScanFeedback(`Added "${matched.name}"`)
			setBarcodeInput('')
			setTimeout(() => setScanFeedback(null), 1500)
		} else {
			setScanFeedback(`No item matched code: "${code}"`)
			setTimeout(() => setScanFeedback(null), 2500)
		}
	}

	function handleHoldSale() {
		if (cartItems.length === 0) return
		const newHeldSale = {
			id: `held_${Date.now()}`,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			items: [...cartItems],
			itemsCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
		}
		setHeldSales((prev) => [...prev, newHeldSale])
		dispatch(clearCart())
	}

	function handleResumeSale(heldId) {
		const target = heldSales.find((s) => s.id === heldId)
		if (!target) return
		dispatch(loadCart(target.items))
		setHeldSales((prev) => prev.filter((s) => s.id !== heldId))
	}

	const filteredProducts = useMemo(() => {
		return products.filter((p) => {
			const matchesCategory =
				selectedCategory === 'all' || p.categoryId === selectedCategory
			const matchesSearch =
				!searchQuery ||
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
			return matchesCategory && matchesSearch
		})
	}, [products, selectedCategory, searchQuery])

	return (
		<div className="pos">
			<div className="pos__products stack">
				{/* Top Search & Barcode Bar */}
				<div className="card row row--space" style={{ gap: '1rem', flexWrap: 'wrap' }}>
					<Input
						placeholder="Search product by name, SKU..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						style={{ flex: 2, minWidth: '200px' }}
					/>
					<form onSubmit={handleBarcodeSubmit} style={{ flex: 1, minWidth: '180px', display: 'flex', gap: '0.5rem' }}>
						<Input
							placeholder="Scan Barcode (Enter)"
							value={barcodeInput}
							onChange={(e) => setBarcodeInput(e.target.value)}
						/>
						<Button type="submit" variant="secondary">Scan</Button>
					</form>
				</div>

				{scanFeedback ? (
					<div
						className="card"
						style={{
							padding: '0.5rem 1rem',
							backgroundColor: scanFeedback.startsWith('Added') ? '#dcfce7' : '#fee2e2',
							color: scanFeedback.startsWith('Added') ? '#166534' : '#991b1b',
							fontWeight: 'bold',
						}}
					>
						{scanFeedback}
					</div>
				) : null}

				{/* Category Pills */}
				<div className="row" style={{ gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
					<button
						type="button"
						className={`button button--${selectedCategory === 'all' ? 'primary' : 'secondary'}`}
						style={{ borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
						onClick={() => setSelectedCategory('all')}
					>
						All Products ({products.length})
					</button>
					{categories.map((c) => (
						<button
							key={c.id}
							type="button"
							className={`button button--${selectedCategory === c.id ? 'primary' : 'secondary'}`}
							style={{ borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
							onClick={() => setSelectedCategory(c.id)}
						>
							{c.name}
						</button>
					))}
				</div>

				{status === 'loading' ? <Loader /> : null}

				{filteredProducts.length === 0 ? (
					<div className="card muted" style={{ textAlign: 'center', padding: '2rem' }}>
						No products found matching your search or category filter.
					</div>
				) : (
					<div className="grid grid--3">
						{filteredProducts.map((p) => (
							<ProductCard
								key={p.id}
								product={p}
								onAdd={() => dispatch(addToCart(p))}
							/>
						))}
					</div>
				)}
			</div>

			<div className="pos__cart stack">
				{/* Held Sales Bar if any */}
				{heldSales.length > 0 ? (
					<div className="card stack" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
						<div className="bold" style={{ fontSize: '0.85rem', color: '#92400e' }}>
							Held Sales ({heldSales.length})
						</div>
						<div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
							{heldSales.map((h) => (
								<Button
									key={h.id}
									variant="secondary"
									style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
									onClick={() => handleResumeSale(h.id)}
								>
									Resume #{h.timestamp} ({h.itemsCount} items)
								</Button>
							))}
						</div>
					</div>
				) : null}

				{/* Cart Container */}
				<div className="card">
					<div className="row row--space" style={{ marginBottom: '0.5rem' }}>
						<h3 className="h3" style={{ margin: 0 }}>Active Cart</h3>
						{cartItems.length > 0 ? (
							<Button
								variant="secondary"
								style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
								onClick={handleHoldSale}
							>
								Hold Sale
							</Button>
						) : null}
					</div>

					{cartItems.length === 0 ? (
						<div className="muted" style={{ padding: '1rem 0' }}>
							No items in cart. Click or scan products to add.
						</div>
					) : (
						<div className="stack" style={{ maxHeight: '350px', overflowY: 'auto' }}>
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
