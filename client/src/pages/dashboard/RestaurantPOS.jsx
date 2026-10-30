import { useState, useEffect } from 'react'
import {
	getTables,
	updateTableStatus,
	createOrder,
	updateOrderStatus,
	getKitchenOrders,
} from '../../services/restaurantService'

export default function RestaurantPOS() {
	const [activeTab, setActiveTab] = useState('tables') // 'tables' | 'kds'
	const [tables, setTables] = useState([])
	const [kitchenOrders, setKitchenOrders] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')

	// Modal State
	const [orderModalTable, setOrderModalTable] = useState(null)
	const [orderItems, setOrderItems] = useState([
		{ name: 'Special Burger Combo', quantity: 1, price: 1250, notes: '' },
	])
	const [waiterName, setWaiterName] = useState('')

	const loadData = async () => {
		try {
			setLoading(true)
			setError('')
			const [tablesData, kdsData] = await Promise.all([getTables(), getKitchenOrders()])
			setTables(tablesData || [])
			setKitchenOrders(kdsData || [])
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to load restaurant data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleStatusChange = async (tableId, newStatus) => {
		try {
			await updateTableStatus(tableId, newStatus)
			setSuccessMsg(`Table status updated to ${newStatus}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const handleOrderStatus = async (orderId, newStatus) => {
		try {
			await updateOrderStatus(orderId, newStatus)
			setSuccessMsg(`Order updated to ${newStatus}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const handlePlaceOrder = async (e) => {
		e.preventDefault()
		if (!orderModalTable) return
		try {
			await createOrder({
				tableId: orderModalTable.id,
				tableNumber: orderModalTable.tableNumber,
				waiterName: waiterName || 'Staff',
				items: orderItems,
			})
			setSuccessMsg(`Order placed for ${orderModalTable.tableNumber}`)
			setTimeout(() => setSuccessMsg(''), 3000)
			setOrderModalTable(null)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const addOrderItem = () => {
		setOrderItems([...orderItems, { name: '', quantity: 1, price: 0, notes: '' }])
	}

	const updateItem = (index, field, value) => {
		const updated = [...orderItems]
		updated[index][field] = value
		setOrderItems(updated)
	}

	return (
		<div className="pos-screen" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
				<div>
					<h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Restaurant & Table Management</h1>
					<p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
						Manage dining room tables, take waiter orders, and stream orders directly to the Kitchen Display System (KDS).
					</p>
				</div>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						type="button"
						className={`btn ${activeTab === 'tables' ? 'btn--primary' : 'btn--secondary'}`}
						onClick={() => setActiveTab('tables')}
					>
						Dining Tables Layout
					</button>
					<button
						type="button"
						className={`btn ${activeTab === 'kds' ? 'btn--primary' : 'btn--secondary'}`}
						onClick={() => setActiveTab('kds')}
					>
						Kitchen Display ({kitchenOrders.length})
					</button>
				</div>
			</div>

			{error && (
				<div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '6px', marginBottom: '1rem' }}>
					{successMsg}
				</div>
			)}

			{loading ? (
				<p>Loading restaurant data...</p>
			) : activeTab === 'tables' ? (
				<div>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
						{tables.map((t) => (
							<div
								key={t.id}
								style={{
									border: `2px solid ${t.status === 'occupied' ? '#ef4444' : t.status === 'reserved' ? '#f59e0b' : '#10b981'}`,
									borderRadius: '8px',
									padding: '1.25rem',
									background: '#ffffff',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between',
								}}
							>
								<div>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{t.tableNumber}</h3>
										<span
											style={{
												padding: '0.2rem 0.6rem',
												borderRadius: '12px',
												fontSize: '0.75rem',
												fontWeight: 600,
												textTransform: 'uppercase',
												background: t.status === 'occupied' ? '#fee2e2' : t.status === 'reserved' ? '#fef3c7' : '#d1fae5',
												color: t.status === 'occupied' ? '#b91c1c' : t.status === 'reserved' ? '#b45309' : '#047857',
											}}
										>
											{t.status}
										</span>
									</div>
									<p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0' }}>
										Floor: <strong>{t.floor || 'Main Floor'}</strong> | Capacity: <strong>{t.capacity} Guests</strong>
									</p>
								</div>

								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
									{t.status === 'available' ? (
										<button
											type="button"
											className="btn btn--primary"
											style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem' }}
											onClick={() => setOrderModalTable(t)}
										>
											Place Order
										</button>
									) : (
										<button
											type="button"
											className="btn btn--secondary"
											style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem' }}
											onClick={() => handleStatusChange(t.id, 'available')}
										>
											Free Table
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div>
					<h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Active Kitchen Orders (KDS)</h2>
					{kitchenOrders.length === 0 ? (
						<div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
							<p style={{ color: '#64748b' }}>No active kitchen orders. Kitchen is all clear!</p>
						</div>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
							{kitchenOrders.map((ko) => (
								<div key={ko.id} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', background: '#ffffff' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
										<strong>Table: {ko.tableNumber}</strong>
										<span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
											{ko.status}
										</span>
									</div>
									<p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.4rem 0' }}>Waiter: {ko.waiterName}</p>
									<div style={{ margin: '0.75rem 0' }}>
										{(ko.items || []).map((itm, idx) => (
											<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', margin: '0.25rem 0' }}>
												<span><strong>{itm.quantity}x</strong> {itm.name}</span>
												<span>Rs. {Number(itm.price || 0) * Number(itm.quantity || 1)}</span>
											</div>
										))}
									</div>
									<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
										{ko.status === 'placed' && (
											<button
												type="button"
												className="btn btn--primary"
												style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem' }}
												onClick={() => handleOrderStatus(ko.id, 'preparing')}
											>
												Start Preparing
											</button>
										)}
										{ko.status === 'preparing' && (
											<button
												type="button"
												className="btn btn--primary"
												style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem', background: '#10b981' }}
												onClick={() => handleOrderStatus(ko.id, 'ready')}
											>
												Mark Ready
											</button>
										)}
										{ko.status === 'ready' && (
											<button
												type="button"
												className="btn btn--secondary"
												style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem' }}
												onClick={() => handleOrderStatus(ko.id, 'paid')}
											>
												Mark Paid & Close
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Order Placement Modal */}
			{orderModalTable && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
					<div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '500px' }}>
						<h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>
							Place Order for {orderModalTable.tableNumber}
						</h2>
						<form onSubmit={handlePlaceOrder}>
							<div style={{ marginBottom: '1rem' }}>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Waiter Name</label>
								<input
									type="text"
									className="form-control"
									value={waiterName}
									onChange={(e) => setWaiterName(e.target.value)}
									placeholder="e.g. Kasun"
									style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>

							<div style={{ marginBottom: '1rem' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
									<label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Order Items</label>
									<button type="button" onClick={addOrderItem} style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
										+ Add Item
									</button>
								</div>
								{orderItems.map((item, idx) => (
									<div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
										<input
											type="text"
											placeholder="Dish name"
											value={item.name}
											onChange={(e) => updateItem(idx, 'name', e.target.value)}
											style={{ flex: 2, padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
											required
										/>
										<input
											type="number"
											min="1"
											placeholder="Qty"
											value={item.quantity}
											onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
											style={{ width: '60px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
											required
										/>
										<input
											type="number"
											step="any"
											placeholder="Price"
											value={item.price}
											onChange={(e) => updateItem(idx, 'price', e.target.value)}
											style={{ width: '90px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
											required
										/>
									</div>
								))}
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
								<button type="button" className="btn btn--secondary" onClick={() => setOrderModalTable(null)}>
									Cancel
								</button>
								<button type="submit" className="btn btn--primary">
									Submit Order to KDS
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

