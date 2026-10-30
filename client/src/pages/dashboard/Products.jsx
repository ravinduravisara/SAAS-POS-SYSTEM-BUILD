import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import ProductForm from '../../components/inventory/ProductForm.jsx'
import { deleteProduct, fetchProducts } from '../../store/slices/productSlice'
import categoryService from '../../services/categoryService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function Products() {
	const dispatch = useDispatch()
	const { items, status, error } = useSelector((s) => s.products)
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [deleteTarget, setDeleteTarget] = useState(null)
	const [categories, setCategories] = useState([])
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')

	useEffect(() => {
		dispatch(fetchProducts())
		categoryService.getAll().then(setCategories).catch(() => setCategories([]))
	}, [dispatch])

	const categoryMap = useMemo(() => {
		const map = {}
		categories.forEach((c) => {
			map[c.id] = c.name
		})
		return map
	}, [categories])

	const filteredItems = useMemo(() => {
		let result = items || []
		if (selectedCategory) {
			result = result.filter((p) => p.categoryId === selectedCategory)
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase()
			result = result.filter(
				(p) =>
					p.name?.toLowerCase().includes(q) ||
					p.sku?.toLowerCase().includes(q) ||
					categoryMap[p.categoryId]?.toLowerCase().includes(q),
			)
		}
		return result
	}, [items, selectedCategory, searchQuery, categoryMap])

	const stats = useMemo(() => {
		const total = items.length
		const inStock = items.filter((p) => Number(p.stock || 0) > 10).length
		const lowStock = items.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 10).length
		const outOfStock = items.filter((p) => Number(p.stock || 0) <= 0).length
		return { total, inStock, lowStock, outOfStock }
	}, [items])

	async function confirmDelete() {
		if (!deleteTarget) return
		try {
			await dispatch(deleteProduct(deleteTarget.id))
			setDeleteTarget(null)
		} catch (err) {
			console.error('Delete failed:', err)
		}
	}

	const columns = useMemo(
		() => [
			{
				label: 'Product Details',
				key: 'name',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
						{row.categoryId && categoryMap[row.categoryId] && (
							<span
								style={{
									display: 'inline-block',
									fontSize: '0.75rem',
									color: '#64748b',
									backgroundColor: '#f1f5f9',
									padding: '1px 6px',
									borderRadius: '4px',
									marginTop: '2px',
								}}
							>
								{categoryMap[row.categoryId]}
							</span>
						)}
					</div>
				),
			},
			{
				label: 'SKU / Barcode',
				key: 'sku',
				render: (row) => (
					<span
						style={{
							fontFamily: 'monospace',
							fontSize: '0.85rem',
							backgroundColor: '#f8fafc',
							border: '1px solid #e2e8f0',
							padding: '2px 6px',
							borderRadius: '4px',
							color: '#334155',
						}}
					>
						{row.sku || 'N/A'}
					</span>
				),
			},
			{
				label: 'Price',
				key: 'price',
				render: (row) => (
					<span style={{ fontWeight: 600, color: '#0f172a' }}>
						{formatCurrency(row.price ?? 0)}
					</span>
				),
			},
			{
				label: 'Stock Health',
				key: 'stock',
				render: (row) => {
					const stock = Number(row.stock || 0)
					if (stock <= 0) {
						return <StatusBadge status="danger" label="Out of Stock (0)" />
					}
					if (stock <= 10) {
						return <StatusBadge status="warning" label={`Low Stock (${stock})`} />
					}
					return <StatusBadge status="success" label={`In Stock (${stock})`} />
				},
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '160px',
				render: (row) => (
					<div style={{ display: 'flex', gap: '6px' }}>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setEditing(row)
								setOpen(true)
							}}
						>
							Edit
						</Button>
						<Button
							variant="secondary"
							size="sm"
							style={{ color: '#dc2626' }}
							onClick={() => setDeleteTarget(row)}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[categoryMap],
	)

	return (
		<div className="stack">
			<PageHeader
				title="Product Catalog"
				subtitle="Manage product items, pricing, inventory SKUs, and category hierarchy."
				actions={
					<Button
						onClick={() => {
							setEditing(null)
							setOpen(true)
						}}
					>
						+ Add Product
					</Button>
				}
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}

			{/* KPI Metric Summary */}
			<div className="grid grid--4">
				<StatCard
					label="Total Catalog"
					value={stats.total}
					subtext="Registered items"
					icon="📦"
				/>
				<StatCard
					label="In Stock"
					value={stats.inStock}
					subtext="Adequate inventory"
					icon="✅"
				/>
				<StatCard
					label="Low Stock Warning"
					value={stats.lowStock}
					subtext="10 units or less"
					icon="⚠️"
				/>
				<StatCard
					label="Out of Stock"
					value={stats.outOfStock}
					subtext="Requires reordering"
					icon="❌"
				/>
			</div>

			{/* Products Table Card */}
			<div className="card" style={{ padding: '1.25rem' }}>
				<DataTable
					columns={columns}
					data={filteredItems}
					loading={status === 'loading'}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search product by name, SKU, or category..."
					actions={
						categories.length > 0 && (
							<select
								className="input"
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								style={{ width: '180px', padding: '0.4rem 0.6rem' }}
							>
								<option value="">All Categories</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						)
					}
					emptyTitle="No products found"
					emptyDescription="No products match your search or filter criteria."
					emptyActionText="+ Add Product"
					onEmptyAction={() => {
						setEditing(null)
						setOpen(true)
					}}
				/>
			</div>

			{/* Add/Edit Product Modal */}
			<Modal
				title={editing ? 'Edit Product' : 'Add New Product'}
				open={open}
				onClose={() => {
					setOpen(false)
					setEditing(null)
				}}
			>
				<ProductForm
					initial={editing}
					categories={categories}
					onDone={() => {
						setOpen(false)
						setEditing(null)
					}}
				/>
			</Modal>

			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				open={Boolean(deleteTarget)}
				title="Delete Product"
				message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? Any active sales data referencing this product may be affected.`}
				confirmLabel="Delete Product"
				isDanger={true}
				onConfirm={confirmDelete}
				onCancel={() => setDeleteTarget(null)}
			/>
		</div>
	)
}
