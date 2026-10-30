import { useState, useEffect } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input from '../../components/common/Input.jsx'
import {
	getTables,
	updateTableStatus,
	createOrder,
	updateOrderStatus,
	getKitchenOrders,
} from '../../services/restaurantService'
import { formatCurrency } from '../../utils/formatCurrency'

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
		<div className="stack">
			<PageHeader
				title="Restaurant & Table Management"
				subtitle="Manage dining room tables, take waiter orders, and stream orders directly to the Kitchen Display System (KDS)."
				actions={
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button
							variant={activeTab === 'tables' ? 'primary' : 'secondary'}
							onClick={() => setActiveTab('tables')}
						>
							Dining Tables ({tables.length})
						</Button>
						<Button
							variant={activeTab === 'kds' ? 'primary' : 'secondary'}
							onClick={() => setActiveTab('kds')}
						>
							Kitchen Display ({kitchenOrders.length})
						</Button>
					</div>
				}
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
					{successMsg}
				</div>
			)}

			{loading ? (
				<div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
					Loading restaurant data...
				</div>
			) : activeTab === 'tables' ? (
				<div>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
							gap: '1rem',
						}}
					>
						{tables.map((t) => {
							const isOcc = t.status === 'occupied'
							const isRes = t.status === 'reserved'
							return (
								<div
									key={t.id}
									className="card"
									style={{
										padding: '1.25rem',
										borderTop: `4px solid ${isOcc ? '#ef4444' : isRes ? '#f59e0b' : '#10b981'}`,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
									}}
								>
									<div>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
												{t.tableNumber}
											</h3>
											<StatusBadge
												status={isOcc ? 'danger' : isRes ? 'warning' : 'success'}
												label={t.status}
											/>
										</div>
										<p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0 1rem 0' }}>
											Floor: <strong>{t.floor || 'Main Dining'}</strong> · Capacity: <strong>{t.capacity} Guests</strong>
										</p>
									</div>

									<div style={{ display: 'flex', gap: '0.5rem' }}>
										{t.status === 'available' ? (
											<Button
												size="sm"
												style={{ flex: 1 }}
												onClick={() => setOrderModalTable(t)}
											>
												+ New Table Order
											</Button>
										) : (
											<Button
												variant="secondary"
												size="sm"
												style={{ flex: 1 }}
												onClick={() => handleStatusChange(t.id, 'available')}
											>
												Mark Table Free
											</Button>
										)}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			) : (
				<div className="stack">
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h3 className="h3" style={{ margin: 0, color: '#0f172a' }}>
							Active Kitchen Tickets (KDS)
						</h3>
						<span style={{ fontSize: '0.85rem', color: '#64748b' }}>
							{kitchenOrders.length} ticket(s) in progress
						</span>
					</div>

					{kitchenOrders.length === 0 ? (
						<div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
							<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🍳</div>
							<div style={{ fontWeight: 600 }}>Kitchen is all clear!</div>
							<div style={{ fontSize: '0.85rem' }}>No pending orders requiring preparation.</div>
						</div>
					) : (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
								gap: '1rem',
							}}
						>
							{kitchenOrders.map((ko) => (
								<div key={ko.id} className="card" style={{ padding: '1.25rem' }}>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											borderBottom: '1px solid #e2e8f0',
											paddingBottom: '0.5rem',
										}}
									>
										<strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>Table {ko.tableNumber}</strong>
										<StatusBadge
											status={ko.status === 'ready' ? 'success' : ko.status === 'preparing' ? 'warning' : 'info'}
											label={ko.status}
										/>
									</div>
									<div style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0' }}>
										Server: <strong>{ko.waiterName}</strong>
									</div>
									<div className="stack" style={{ gap: '0.4rem', margin: '0.75rem 0' }}>
										{(ko.items || []).map((itm, idx) => (
											<div
												key={idx}
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													fontSize: '0.875rem',
													backgroundColor: '#f8fafc',
													padding: '4px 8px',
													borderRadius: '4px',
												}}
											>
												<span>
													<strong>{itm.quantity}x</strong> {itm.name}
												</span>
												<span style={{ color: '#64748b' }}>
													{formatCurrency(Number(itm.price || 0) * Number(itm.quantity || 1))}
												</span>
											</div>
										))}
									</div>
									<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
										{ko.status === 'placed' && (
											<Button
												size="sm"
												style={{ flex: 1 }}
												onClick={() => handleOrderStatus(ko.id, 'preparing')}
											>
												Start Cooking
											</Button>
										)}
										{ko.status === 'preparing' && (
											<Button
												size="sm"
												style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }}
												onClick={() => handleOrderStatus(ko.id, 'ready')}
											>
												Mark Food Ready
											</Button>
										)}
										{ko.status === 'ready' && (
											<Button
												variant="secondary"
												size="sm"
												style={{ flex: 1 }}
												onClick={() => handleOrderStatus(ko.id, 'paid')}
											>
												Mark Delivered & Paid
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Place Order Modal */}
			<Modal
				title={`Place Order: Table ${orderModalTable?.tableNumber || ''}`}
				open={Boolean(orderModalTable)}
				onClose={() => setOrderModalTable(null)}
			>
				<form onSubmit={handlePlaceOrder} className="stack">
					<Input
						label="Waiter / Server Name"
						placeholder="e.g. Kasun"
						value={waiterName}
						onChange={(e) => setWaiterName(e.target.value)}
					/>

					<div className="stack" style={{ gap: '0.5rem' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<label className="label" style={{ margin: 0 }}>Order Items</label>
							<button
								type="button"
								onClick={addOrderItem}
								style={{
									fontSize: '0.8rem',
									color: '#4f46e5',
									background: 'none',
									border: 'none',
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								+ Add Item
							</button>
						</div>

						{orderItems.map((item, idx) => (
							<div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
								<input
									type="text"
									placeholder="Dish / Drink Name"
									value={item.name}
									onChange={(e) => updateItem(idx, 'name', e.target.value)}
									className="input"
									style={{ flex: 2 }}
									required
								/>
								<input
									type="number"
									min="1"
									placeholder="Qty"
									value={item.quantity}
									onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
									className="input"
									style={{ width: '65px' }}
									required
								/>
								<input
									type="number"
									step="any"
									placeholder="Price"
									value={item.price}
									onChange={(e) => updateItem(idx, 'price', e.target.value)}
									className="input"
									style={{ width: '95px' }}
									required
								/>
							</div>
						))}
					</div>

					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setOrderModalTable(null)}>
							Cancel
						</Button>
						<Button type="submit">Submit to Kitchen</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
