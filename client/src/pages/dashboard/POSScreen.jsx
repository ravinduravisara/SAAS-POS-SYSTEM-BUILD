import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../../components/pos/ProductCard.jsx'
import CartItem from '../../components/pos/CartItem.jsx'
import CheckoutPanel from '../../components/pos/CheckoutPanel.jsx'
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import { fetchProducts } from '../../store/slices/productSlice'
import { addToCart, removeFromCart, setQuantity, clearCart, loadCart } from '../../store/slices/cartSlice'
import categoryService from '../../services/categoryService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function POSScreen() {
	const dispatch = useDispatch()
	const searchInputRef = useRef(null)
	const { items: products, status } = useSelector((state) => state.products)
	const cartItems = useSelector((state) => state.cart.items)

	const [categories, setCategories] = useState([])
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [barcodeInput, setBarcodeInput] = useState('')
	const [heldSales, setHeldSales] = useState([])
	const [scanFeedback, setScanFeedback] = useState(null)
	const [mobileCartOpen, setMobileCartOpen] = useState(false)

	const handleHoldSale = useCallback(() => {
		if (cartItems.length === 0) return
		const newHeldSale = {
			id: `held_${Date.now()}`,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			items: [...cartItems],
			itemsCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
			total: cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
		}
		setHeldSales((prev) => [...prev, newHeldSale])
		dispatch(clearCart())
	}, [cartItems, dispatch])

	useEffect(() => {
		dispatch(fetchProducts())
		categoryService.getAll().then(setCategories).catch(() => {})
	}, [dispatch])

	// POS Keyboard Shortcuts (F2: Search, F8: Hold Sale, Esc: Close Drawer)
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'F2') {
				e.preventDefault()
				searchInputRef.current?.focus()
			} else if (e.key === 'F8') {
				e.preventDefault()
				handleHoldSale()
			} else if (e.key === 'Escape') {
				setMobileCartOpen(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleHoldSale])

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
			setScanFeedback({ text: `Added "${matched.name}"`, success: true })
			setBarcodeInput('')
			setTimeout(() => setScanFeedback(null), 1800)
		} else {
			setScanFeedback({ text: `Item not found for code: "${code}"`, success: false })
			setTimeout(() => setScanFeedback(null), 2500)
		}
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

	const cartTotal = useMemo(() => {
		return cartItems.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1), 0)
	}, [cartItems])

	const cartCount = useMemo(() => {
		return cartItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0)
	}, [cartItems])

	return (
		<div style={{ position: 'relative' }}>
			{/* Top Bar with Shortcuts Hint */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '12px',
					flexWrap: 'wrap',
					gap: '8px',
				}}
			>
				<div>
					<h2 className="h2" style={{ margin: 0 }}>Point of Sale Terminal</h2>
					<div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
						Fast checkout terminal with barcode scanner and dual-currency support.
					</div>
				</div>
				<div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--muted)' }}>
					<span style={{ padding: '3px 6px', background: '#e2e8f0', borderRadius: '4px' }}>F2: Search</span>
					<span style={{ padding: '3px 6px', background: '#e2e8f0', borderRadius: '4px' }}>F8: Hold Sale</span>
					<span style={{ padding: '3px 6px', background: '#e2e8f0', borderRadius: '4px' }}>F9: Pay</span>
				</div>
			</div>

			<div className="pos">
				{/* LEFT: Products Catalog */}
				<div className="pos__products stack">
					{/* Search & Barcode Form */}
					<div className="card" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px' }}>
						<div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
							<span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
								🔍
							</span>
							<input
								ref={searchInputRef}
								type="text"
								className="input"
								placeholder="Search products by name or SKU (F2)..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								style={{ paddingLeft: '32px' }}
							/>
						</div>
						<form onSubmit={handleBarcodeSubmit} style={{ flex: 1, minWidth: '180px', display: 'flex', gap: '6px' }}>
							<input
								type="text"
								className="input"
								placeholder="Scan Barcode (Enter)"
								value={barcodeInput}
								onChange={(e) => setBarcodeInput(e.target.value)}
							/>
							<Button type="submit" variant="secondary" size="sm">
								Scan
							</Button>
						</form>
					</div>

					{/* Feedback Banner */}
					{scanFeedback && (
						<div
							style={{
								padding: '8px 14px',
								borderRadius: '6px',
								fontSize: '0.85rem',
								fontWeight: 600,
								background: scanFeedback.success ? 'var(--success-light)' : 'var(--danger-light)',
								color: scanFeedback.success ? 'var(--success)' : 'var(--danger)',
								border: `1px solid ${scanFeedback.success ? '#bbf7d0' : '#fecaca'}`,
							}}
						>
							{scanFeedback.text}
						</div>
					)}

					{/* Category Tabs */}
					<div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
						<button
							type="button"
							className={`btn ${selectedCategory === 'all' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
							onClick={() => setSelectedCategory('all')}
							style={{ borderRadius: '9999px', whiteSpace: 'nowrap' }}
						>
							All Items ({products.length})
						</button>
						{categories.map((c) => (
							<button
								key={c.id}
								type="button"
								className={`btn ${selectedCategory === c.id ? 'btn--primary' : 'btn--secondary'} btn--sm`}
								onClick={() => setSelectedCategory(c.id)}
								style={{ borderRadius: '9999px', whiteSpace: 'nowrap' }}
							>
								{c.name}
							</button>
						))}
					</div>

					{/* Products Grid */}
					{status === 'loading' ? (
						<LoadingSkeleton type="card" count={6} />
					) : filteredProducts.length === 0 ? (
						<div className="card empty-state">
							<div className="empty-state__title">No products found</div>
							<div className="empty-state__desc">
								No catalog items match your search &quot;{searchQuery}&quot;.
							</div>
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

				{/* RIGHT: Cart and Checkout (Desktop) */}
				<div className="pos__cart stack">
					{/* Held Sales Bar */}
					{heldSales.length > 0 && (
						<div className="card" style={{ background: 'var(--warning-light)', borderColor: '#fde68a', padding: '12px' }}>
							<div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400e', marginBottom: '6px' }}>
								Parked / Held Sales ({heldSales.length})
							</div>
							<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
								{heldSales.map((h) => (
									<button
										key={h.id}
										type="button"
										className="btn btn--secondary btn--sm"
										onClick={() => handleResumeSale(h.id)}
										style={{ fontSize: '0.75rem', padding: '3px 8px' }}
									>
										Resume #{h.timestamp} ({h.itemsCount} items)
									</button>
								))}
							</div>
						</div>
					)}

					{/* Cart Container */}
					<div className="card" style={{ padding: '16px' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
							<h3 className="h3">Active Cart ({cartCount})</h3>
							{cartItems.length > 0 && (
								<div style={{ display: 'flex', gap: '6px' }}>
									<button
										type="button"
										className="btn btn--secondary btn--sm"
										onClick={handleHoldSale}
										style={{ fontSize: '0.75rem', padding: '3px 8px' }}
									>
										Hold (F8)
									</button>
									<button
										type="button"
										className="btn btn--secondary btn--sm"
										onClick={() => dispatch(clearCart())}
										style={{ fontSize: '0.75rem', padding: '3px 8px', color: 'var(--danger)' }}
									>
										Clear
									</button>
								</div>
							)}
						</div>

						{cartItems.length === 0 ? (
							<div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontSize: '0.875rem' }}>
								🛒 Cart is empty. Click or scan products to add.
							</div>
						) : (
							<div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
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

					<CheckoutPanel onHoldSale={handleHoldSale} />
				</div>
			</div>

			{/* Mobile Cart Floating Action Bar */}
			<div
				className="mobile-cart-bar"
				style={{
					position: 'fixed',
					bottom: 0,
					left: 0,
					right: 0,
					background: 'var(--panel)',
					borderTop: '1px solid var(--border)',
					padding: '12px 16px',
					boxShadow: 'var(--shadow-lg)',
					display: 'none', // Shown in CSS media queries on mobile
					zIndex: 30,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div>
					<div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{cartCount} items in cart</div>
					<div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
						{formatCurrency(cartTotal)}
					</div>
				</div>
				<Button
					variant="primary"
					onClick={() => setMobileCartOpen(true)}
					disabled={cartItems.length === 0}
				>
					View Cart & Pay →
				</Button>
			</div>

			{/* Mobile Cart Drawer Modal */}
			<Modal
				title={`Cart (${cartCount})`}
				open={mobileCartOpen}
				onClose={() => setMobileCartOpen(false)}
			>
				<div className="stack">
					{cartItems.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
							🛒 Cart is empty.
						</div>
					) : (
						<div style={{ maxHeight: '280px', overflowY: 'auto' }}>
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
					<CheckoutPanel
						onHoldSale={() => {
							handleHoldSale()
							setMobileCartOpen(false)
						}}
					/>
				</div>
			</Modal>
		</div>
	)
}
