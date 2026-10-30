import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import PlanGate from '../../components/common/PlanGate.jsx'
import purchaseService from '../../services/purchaseService'
import supplierService from '../../services/supplierService'
import productService from '../../services/productService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function Purchases() {
	const [activeTab, setActiveTab] = useState('purchases')
	const [purchases, setPurchases] = useState([])
	const [suppliers, setSuppliers] = useState([])
	const [products, setProducts] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')

	// New Purchase Form state
	const [newPurchaseOpen, setNewPurchaseOpen] = useState(false)
	const [selectedSupplierId, setSelectedSupplierId] = useState('')
	const [purchaseNotes, setPurchaseNotes] = useState('')
	const [purchaseLines, setPurchaseLines] = useState([
		{ productId: '', name: '', quantity: 1, costPrice: 0 },
	])
	const [submitting, setSubmitting] = useState(false)

	// New Supplier Form state
	const [supplierModalOpen, setSupplierModalOpen] = useState(false)
	const [supplierForm, setSupplierForm] = useState({
		name: '',
		contactName: '',
		phone: '',
		email: '',
		paymentTerms: 'net30',
	})

	useEffect(() => {
		let active = true
		Promise.all([
			purchaseService.getAll().catch(() => []),
			supplierService.getAll().catch(() => []),
			productService.getAll().catch(() => []),
		]).then(([purchData, suppData, prodData]) => {
			if (active) {
				setPurchases(purchData || [])
				setSuppliers(suppData || [])
				setProducts(prodData || [])
				setLoading(false)
			}
		})
		return () => {
			active = false
		}
	}, [])

	async function reloadData() {
		try {
			setLoading(true)
			const [purchData, suppData] = await Promise.all([
				purchaseService.getAll(),
				supplierService.getAll(),
			])
			setPurchases(purchData || [])
			setSuppliers(suppData || [])
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to reload data')
		} finally {
			setLoading(false)
		}
	}

	function handleAddLine() {
		setPurchaseLines((prev) => [
			...prev,
			{ productId: '', name: '', quantity: 1, costPrice: 0 },
		])
	}

	function handleLineChange(index, field, value) {
		setPurchaseLines((prev) => {
			const copy = [...prev]
			copy[index] = { ...copy[index], [field]: value }
			if (field === 'productId') {
				const prod = products.find((p) => p.id === value)
				if (prod) {
					copy[index].name = prod.name
					copy[index].costPrice = Number(prod.cost || prod.price || 0)
				}
			}
			return copy
		})
	}

	function handleRemoveLine(index) {
		setPurchaseLines((prev) => prev.filter((_, i) => i !== index))
	}

	const purchaseGrandTotal = useMemo(() => {
		return purchaseLines.reduce((sum, line) => {
			return sum + Number(line.costPrice || 0) * Number(line.quantity || 1)
		}, 0)
	}, [purchaseLines])

	async function handleSubmitPurchase(e) {
		e.preventDefault()
		if (!selectedSupplierId) {
			setError('Please select a supplier')
			return
		}
		const validLines = purchaseLines.filter((l) => l.productId && l.quantity > 0)
		if (validLines.length === 0) {
			setError('Please select at least one valid product line to receive')
			return
		}

		setSubmitting(true)
		setError(null)
		try {
			const supplier = suppliers.find((s) => s.id === selectedSupplierId)
			await purchaseService.create({
				supplierId: selectedSupplierId,
				supplierName: supplier?.name || 'Supplier',
				items: validLines.map((l) => ({
					productId: l.productId,
					name: l.name,
					quantity: Number(l.quantity),
					costPrice: Number(l.costPrice),
				})),
				totalCost: purchaseGrandTotal,
				notes: purchaseNotes,
			})
			setNewPurchaseOpen(false)
			setPurchaseLines([{ productId: '', name: '', quantity: 1, costPrice: 0 }])
			setSelectedSupplierId('')
			setPurchaseNotes('')
			await reloadData()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to record purchase')
		} finally {
			setSubmitting(false)
		}
	}

	async function handleSubmitSupplier(e) {
		e.preventDefault()
		try {
			await supplierService.create(supplierForm)
			setSupplierModalOpen(false)
			setSupplierForm({
				name: '',
				contactName: '',
				phone: '',
				email: '',
				paymentTerms: 'net30',
			})
			await reloadData()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to save supplier')
		}
	}

	const filteredPurchases = useMemo(() => {
		return purchases.filter((p) => {
			return (
				!searchQuery ||
				(p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
			)
		})
	}, [purchases, searchQuery])

	const purchaseColumns = [
		{
			key: 'id',
			label: 'GRN Number',
			render: (p) => (
				<div>
					<div style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{p.id.slice(0, 8)}</div>
					<div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDate(p.createdAt)}</div>
				</div>
			),
		},
		{
			key: 'supplier',
			label: 'Supplier',
			render: (p) => <span style={{ fontWeight: 600 }}>{p.supplierName || 'Unknown Vendor'}</span>,
		},
		{
			key: 'items',
			label: 'Items Received',
			render: (p) => <span>{p.items?.length || 1} line item(s)</span>,
		},
		{
			key: 'total',
			label: 'Total Cost',
			render: (p) => (
				<strong style={{ color: 'var(--text)' }}>
					{formatCurrency(p.totalCost || p.total || 0)}
				</strong>
			),
		},
		{
			key: 'status',
			label: 'Status',
			render: (p) => <StatusBadge status={p.status || 'received'} />,
		},
	]

	const supplierColumns = [
		{
			key: 'name',
			label: 'Supplier Name',
			render: (s) => (
				<div>
					<div style={{ fontWeight: 600 }}>{s.name}</div>
					{s.contactName && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Attn: {s.contactName}</div>}
				</div>
			),
		},
		{
			key: 'phone',
			label: 'Phone Number',
			render: (s) => <span>{s.phone || '-'}</span>,
		},
		{
			key: 'email',
			label: 'Email',
			render: (s) => <span>{s.email || '-'}</span>,
		},
		{
			key: 'terms',
			label: 'Payment Terms',
			render: (s) => (
				<span style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px' }}>
					{s.paymentTerms || 'Net 30'}
				</span>
			),
		},
	]

	return (
		<PlanGate feature="purchases.core">
			<div>
				<PageHeader
					title="Purchasing & Goods Received Notes (GRN)"
					subtitle="Manage vendor orders, receive incoming inventory stock, and track vendor directory."
					actions={
						<div style={{ display: 'flex', gap: '8px' }}>
							<Button variant="secondary" onClick={() => setSupplierModalOpen(true)}>
								+ New Supplier
							</Button>
							<Button variant="primary" onClick={() => setNewPurchaseOpen(true)}>
								+ Receive Stock (GRN)
							</Button>
						</div>
					}
				/>

				{error && (
					<div
						style={{
							padding: '12px 16px',
							background: 'var(--danger-light)',
							border: '1px solid #fecaca',
							color: 'var(--danger)',
							borderRadius: '8px',
							marginBottom: '16px',
							fontSize: '0.875rem',
						}}
					>
						{error}
					</div>
				)}

				{/* Tab Selector */}
				<div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button
							type="button"
							className={`btn btn--sm ${activeTab === 'purchases' ? 'btn--primary' : 'btn--secondary'}`}
							onClick={() => setActiveTab('purchases')}
						>
							Goods Received Notes (GRN) ({purchases.length})
						</button>
						<button
							type="button"
							className={`btn btn--sm ${activeTab === 'suppliers' ? 'btn--primary' : 'btn--secondary'}`}
							onClick={() => setActiveTab('suppliers')}
						>
							Suppliers Directory ({suppliers.length})
						</button>
					</div>
				</div>

				{activeTab === 'purchases' ? (
					<DataTable
						columns={purchaseColumns}
						data={filteredPurchases}
						loading={loading}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search purchases by GRN or supplier..."
						emptyTitle="No purchases recorded"
						emptyDescription="Click '+ Receive Stock (GRN)' to log incoming inventory shipments."
						emptyActionText="+ Receive Stock"
						onEmptyAction={() => setNewPurchaseOpen(true)}
					/>
				) : (
					<DataTable
						columns={supplierColumns}
						data={suppliers}
						loading={loading}
						emptyTitle="No suppliers registered"
						emptyDescription="Click '+ New Supplier' to add vendors to your directory."
						emptyActionText="+ New Supplier"
						onEmptyAction={() => setSupplierModalOpen(true)}
					/>
				)}

				{/* New Purchase Modal */}
				<Modal
					open={newPurchaseOpen}
					onClose={() => setNewPurchaseOpen(false)}
					title="Receive Stock / Goods Received Note (GRN)"
					maxWidth="620px"
				>
					<form onSubmit={handleSubmitPurchase} className="stack" style={{ gap: '14px' }}>
						<div className="field">
							<label className="field__label">Supplier Vendor *</label>
							<select
								className="select"
								required
								value={selectedSupplierId}
								onChange={(e) => setSelectedSupplierId(e.target.value)}
							>
								<option value="">Select a supplier...</option>
								{suppliers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} {s.contactName ? `(${s.contactName})` : ''}
									</option>
								))}
							</select>
						</div>

						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<label className="field__label" style={{ margin: 0 }}>Line Items to Receive *</label>
								<button
									type="button"
									onClick={handleAddLine}
									style={{
										background: 'none',
										border: 'none',
										color: 'var(--primary)',
										fontWeight: 600,
										fontSize: '0.8rem',
										cursor: 'pointer',
									}}
								>
									+ Add Line Item
								</button>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
								{purchaseLines.map((line, idx) => (
									<div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
										<select
											className="select"
											style={{ flex: 2 }}
											required
											value={line.productId}
											onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
										>
											<option value="">Select product...</option>
											{products.map((p) => (
												<option key={p.id} value={p.id}>
													{p.name} (Cur. Stock: {p.stock || 0})
												</option>
											))}
										</select>
										<input
											type="number"
											className="input"
											style={{ width: '70px' }}
											min="1"
											placeholder="Qty"
											required
											value={line.quantity}
											onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
										/>
										<input
											type="number"
											className="input"
											style={{ width: '100px' }}
											step="any"
											placeholder="Cost (Rs.)"
											required
											value={line.costPrice}
											onChange={(e) => handleLineChange(idx, 'costPrice', e.target.value)}
										/>
										{purchaseLines.length > 1 && (
											<button
												type="button"
												onClick={() => handleRemoveLine(idx)}
												style={{
													background: 'none',
													border: 'none',
													color: 'var(--danger)',
													cursor: 'pointer',
													fontSize: '1rem',
													padding: '4px',
												}}
												title="Remove line"
											>
												✕
											</button>
										)}
									</div>
								))}
							</div>
						</div>

						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '12px',
								background: '#f8fafc',
								borderRadius: '8px',
								border: '1px solid var(--border)',
							}}
						>
							<span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Estimated Total Cost:</span>
							<span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>
								{formatCurrency(purchaseGrandTotal)}
							</span>
						</div>

						<div className="field">
							<label className="field__label">GRN Reference / Notes</label>
							<input
								type="text"
								className="input"
								placeholder="e.g. Invoice #PO-9921, Delivery Batch 2"
								value={purchaseNotes}
								onChange={(e) => setPurchaseNotes(e.target.value)}
							/>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
							<Button variant="secondary" onClick={() => setNewPurchaseOpen(false)} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" variant="primary" loading={submitting}>
								Confirm GRN & Restock Inventory
							</Button>
						</div>
					</form>
				</Modal>

				{/* New Supplier Modal */}
				<Modal
					open={supplierModalOpen}
					onClose={() => setSupplierModalOpen(false)}
					title="Register New Supplier Vendor"
					maxWidth="480px"
				>
					<form onSubmit={handleSubmitSupplier} className="stack" style={{ gap: '14px' }}>
						<div className="field">
							<label className="field__label">Supplier Legal Name *</label>
							<input
								type="text"
								className="input"
								required
								placeholder="e.g. Ceylon Beverage Distributors Ltd"
								value={supplierForm.name}
								onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
							/>
						</div>
						<div className="field">
							<label className="field__label">Contact Representative</label>
							<input
								type="text"
								className="input"
								placeholder="e.g. Ruwan Jayawardena"
								value={supplierForm.contactName}
								onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
							/>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
							<div className="field">
								<label className="field__label">Phone Number</label>
								<input
									type="text"
									className="input"
									placeholder="+94 77 123 4567"
									value={supplierForm.phone}
									onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
								/>
							</div>
							<div className="field">
								<label className="field__label">Email</label>
								<input
									type="email"
									className="input"
									placeholder="vendor@distributor.com"
									value={supplierForm.email}
									onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
								/>
							</div>
						</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
							<Button variant="secondary" onClick={() => setSupplierModalOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" variant="primary">
								Save Supplier
							</Button>
						</div>
					</form>
				</Modal>
			</div>
		</PlanGate>
	)
}
