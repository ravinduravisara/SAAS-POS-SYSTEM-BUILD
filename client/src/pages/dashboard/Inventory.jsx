import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import StockUpdateModal from '../../components/inventory/StockUpdateModal.jsx'
import inventoryService from '../../services/inventoryService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function Inventory() {
	const [items, setItems] = useState([])
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')

	const load = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const data = await inventoryService.list()
			setItems(data || [])
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load inventory')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const filteredItems = useMemo(() => {
		if (!searchQuery.trim()) return items
		const q = searchQuery.toLowerCase()
		return items.filter(
			(i) =>
				i.name?.toLowerCase().includes(q) ||
				i.sku?.toLowerCase().includes(q),
		)
	}, [items, searchQuery])

	const stats = useMemo(() => {
		const totalSkus = items.length
		const totalUnits = items.reduce((sum, i) => sum + (Number(i.stock) || 0), 0)
		const lowStock = items.filter((i) => Number(i.stock || 0) > 0 && Number(i.stock || 0) <= 10).length
		const outOfStock = items.filter((i) => Number(i.stock || 0) <= 0).length
		return { totalSkus, totalUnits, lowStock, outOfStock }
	}, [items])

	const columns = useMemo(
		() => [
			{
				label: 'Product Item',
				key: 'name',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
						{row.sku && (
							<span
								style={{
									fontFamily: 'monospace',
									fontSize: '0.75rem',
									color: '#64748b',
									backgroundColor: '#f1f5f9',
									padding: '1px 5px',
									borderRadius: '3px',
									marginTop: '2px',
									display: 'inline-block',
								}}
							>
								{row.sku}
							</span>
						)}
					</div>
				),
			},
			{
				label: 'Unit Price',
				key: 'price',
				render: (row) => (
					<span style={{ fontWeight: 500, color: '#0f172a' }}>
						{formatCurrency(row.price ?? 0)}
					</span>
				),
			},
			{
				label: 'Available Quantity',
				key: 'stock',
				render: (row) => {
					const stock = Number(row.stock || 0)
					if (stock <= 0) {
						return <StatusBadge status="danger" label="0 units (Depleted)" />
					}
					if (stock <= 10) {
						return <StatusBadge status="warning" label={`${stock} units (Low)`} />
					}
					return <StatusBadge status="success" label={`${stock} units in stock`} />
				},
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '140px',
				render: (row) => (
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							setSelected(row)
							setOpen(true)
						}}
					>
						Adjust Stock
					</Button>
				),
			},
		],
		[],
	)

	return (
		<div className="stack">
			<PageHeader
				title="Inventory & Stock Control"
				subtitle="Monitor stock quantities, replenishment alerts, and perform physical inventory adjustments."
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}

			{/* KPI Summary Cards */}
			<div className="grid grid--4">
				<StatCard
					label="Monitored SKUs"
					value={stats.totalSkus}
					subtext="Distinct products"
					icon="📦"
				/>
				<StatCard
					label="Total Stock Units"
					value={stats.totalUnits.toLocaleString()}
					subtext="Cumulative warehouse inventory"
					icon="📊"
				/>
				<StatCard
					label="Low Stock Alert"
					value={stats.lowStock}
					subtext="Needs reorder soon"
					icon="⚠️"
				/>
				<StatCard
					label="Depleted Items"
					value={stats.outOfStock}
					subtext="Out of stock"
					icon="🚨"
				/>
			</div>

			{/* Inventory DataTable */}
			<div className="card" style={{ padding: '1.25rem' }}>
				<DataTable
					columns={columns}
					data={filteredItems}
					loading={loading}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search inventory by product name or SKU..."
					emptyTitle="No inventory items found"
					emptyDescription="No product items match your search."
				/>
			</div>

			{/* Stock Adjustment Modal */}
			<StockUpdateModal
				open={open}
				product={selected}
				onClose={() => {
					setOpen(false)
					setSelected(null)
				}}
				onSave={async ({ productId, stock }) => {
					await inventoryService.setStock(productId, stock)
					setOpen(false)
					setSelected(null)
					await load()
				}}
			/>
		</div>
	)
}
