import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import Input from '../../components/common/Input.jsx'
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

	// New Purchase Form state
	const [newPurchaseOpen, setNewPurchaseOpen] = useState(false)
	const [selectedSupplierId, setSelectedSupplierId] = useState('')
	const [purchaseNotes, setPurchaseNotes] = useState('')
	const [purchaseLines, setPurchaseLines] = useState([
		{ productId: '', name: '', quantity: 1, costPrice: 0 },
	])

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
				setPurchases(purchData)
				setSuppliers(suppData)
				setProducts(prodData)
				setLoading(false)
			}
		})
		return () => {
			active = false
		}
	}, [])

	async function reloadData() {
		try {
			const [purchData, suppData] = await Promise.all([
				purchaseService.getAll(),
				supplierService.getAll(),
			])
			setPurchases(purchData)
			setSuppliers(suppData)
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to reload data')
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
					copy[index].costPrice = prod.costPrice || prod.price || 0
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
			const qty = Number(line.quantity || 0)
			const price = Number(line.costPrice || 0)
			return sum + qty * price
		}, 0)
	}, [purchaseLines])

	async function submitPurchase(e) {
		e.preventDefault()
		setError(null)
		try {
			const validItems = purchaseLines.filter((l) => l.productId && Number(l.quantity) > 0)
			if (validItems.length === 0) {
				setError('Please select at least one product with valid quantity')
				return
			}
			const supp = suppliers.find((s) => s.id === selectedSupplierId)
			await purchaseService.create({
				supplierId: selectedSupplierId || null,
				supplierName: supp?.name || 'General Supplier',
				notes: purchaseNotes,
				items: validItems,
			})
			setNewPurchaseOpen(false)
			setPurchaseLines([{ productId: '', name: '', quantity: 1, costPrice: 0 }])
			setSelectedSupplierId('')
			setPurchaseNotes('')
			await reloadData()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to create purchase')
		}
	}

	async function submitSupplier(e) {
		e.preventDefault()
		setError(null)
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
			setError(err?.response?.data?.message || err?.message || 'Failed to add supplier')
		}
	}

	const purchaseColumns = useMemo(
		() => [
			{ header: 'PO / Ref', key: 'id' },
			{
				header: 'Date',
				key: 'createdAt',
				render: (row) => formatDate(row.createdAt),
			},
			{ header: 'Supplier', key: 'supplierName' },
			{
				header: 'Items Count',
				key: 'items',
				render: (row) => (row.items || []).length,
			},
			{
				header: 'Total Cost',
				key: 'total',
				render: (row) => <strong>{formatCurrency(row.total)}</strong>,
			},
			{
				header: 'Status',
				key: 'status',
				render: (row) => (
					<span
						style={{
							padding: '3px 8px',
							borderRadius: '4px',
							fontSize: '0.8rem',
							fontWeight: 'bold',
							backgroundColor: '#dcfce7',
							color: '#166534',
						}}
					>
						{String(row.status || 'received').toUpperCase()}
					</span>
				),
			},
		],
		[],
	)

	const supplierColumns = useMemo(
		() => [
			{ header: 'Supplier Name', key: 'name' },
			{ header: 'Contact Person', key: 'contactName' },
			{ header: 'Phone', key: 'phone' },
			{ header: 'Email', key: 'email' },
			{
				header: 'Terms',
				key: 'paymentTerms',
				render: (row) => (
					<span className="badge" style={{ textTransform: 'uppercase' }}>
						{row.paymentTerms}
					</span>
				),
			},
		],
		[],
	)

	return (
		<PlanGate feature="purchaseManagement">
			<div className="stack">
				<div className="row row--space">
					<div>
						<h2 className="h2" style={{ margin: 0 }}>Procurement & Purchasing</h2>
						<div className="muted">Manage suppliers, purchase orders, and goods receiving.</div>
					</div>
					<div className="row" style={{ gap: '0.5rem' }}>
						{activeTab === 'purchases' ? (
							<Button onClick={() => setNewPurchaseOpen(true)}>+ Receive Goods (GRN)</Button>
						) : (
							<Button onClick={() => setSupplierModalOpen(true)}>+ Add Supplier</Button>
						)}
					</div>
				</div>

				{error ? <div className="card error">{error}</div> : null}

				<div className="row" style={{ gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
					<Button
						variant={activeTab === 'purchases' ? 'primary' : 'secondary'}
						onClick={() => setActiveTab('purchases')}
					>
						Purchase Orders & History ({purchases.length})
					</Button>
					<Button
						variant={activeTab === 'suppliers' ? 'primary' : 'secondary'}
						onClick={() => setActiveTab('suppliers')}
					>
						Suppliers ({suppliers.length})
					</Button>
				</div>

				{loading ? (
					<div className="card muted">Loading data...</div>
				) : activeTab === 'purchases' ? (
					<Table columns={purchaseColumns} data={purchases} />
				) : (
					<Table columns={supplierColumns} data={suppliers} />
				)}

				{/* Receive Goods (GRN) Modal */}
				<Modal
					title="Receive Goods / Purchase Order"
					open={newPurchaseOpen}
					onClose={() => setNewPurchaseOpen(false)}
				>
					<form className="stack" onSubmit={submitPurchase}>
						<div>
							<label className="label">Select Supplier</label>
							<select
								className="input"
								value={selectedSupplierId}
								onChange={(e) => setSelectedSupplierId(e.target.value)}
							>
								<option value="">General Supplier</option>
								{suppliers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} ({s.contactName || s.phone})
									</option>
								))}
							</select>
						</div>

						<h4 className="h4" style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>Items to Receive</h4>
						<div className="stack" style={{ maxHeight: '240px', overflowY: 'auto' }}>
							{purchaseLines.map((line, idx) => (
								<div key={idx} className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
									<select
										className="input"
										style={{ flex: 2 }}
										value={line.productId}
										onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
										required
									>
										<option value="">Select Product...</option>
										{products.map((p) => (
											<option key={p.id} value={p.id}>
												{p.name} (Stock: {p.stock})
											</option>
										))}
									</select>
									<Input
										placeholder="Qty"
										type="number"
										min="1"
										style={{ width: '80px' }}
										value={line.quantity}
										onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
										required
									/>
									<Input
										placeholder="Unit Cost"
										type="number"
										step="0.01"
										min="0"
										style={{ width: '100px' }}
										value={line.costPrice}
										onChange={(e) => handleLineChange(idx, 'costPrice', e.target.value)}
										required
									/>
									<span style={{ minWidth: '70px', fontWeight: 'bold' }}>
										{formatCurrency(Number(line.quantity || 0) * Number(line.costPrice || 0))}
									</span>
									{purchaseLines.length > 1 ? (
										<Button
											type="button"
											variant="secondary"
											onClick={() => handleRemoveLine(idx)}
										>
											✕
										</Button>
									) : null}
								</div>
							))}
						</div>

						<Button type="button" variant="secondary" onClick={handleAddLine}>
							+ Add Another Item
						</Button>

						<div className="row row--space" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '4px' }}>
							<span className="bold">Total Purchase Value:</span>
							<span className="bold" style={{ fontSize: '1.2rem', color: '#0f766e' }}>
								{formatCurrency(purchaseGrandTotal)}
							</span>
						</div>

						<Input
							label="Notes / Delivery Reference"
							value={purchaseNotes}
							onChange={(e) => setPurchaseNotes(e.target.value)}
							placeholder="Invoice #, Bill of Lading, etc."
						/>

						<div className="row row--space" style={{ marginTop: '1rem' }}>
							<Button type="button" variant="secondary" onClick={() => setNewPurchaseOpen(false)}>
								Cancel
							</Button>
							<Button type="submit">Complete Goods Receipt & Restock</Button>
						</div>
					</form>
				</Modal>

				{/* Add Supplier Modal */}
				<Modal
					title="Register New Supplier"
					open={supplierModalOpen}
					onClose={() => setSupplierModalOpen(false)}
				>
					<form className="stack" onSubmit={submitSupplier}>
						<Input
							label="Supplier / Company Name"
							value={supplierForm.name}
							onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
							required
						/>
						<Input
							label="Contact Person"
							value={supplierForm.contactName}
							onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
						/>
						<Input
							label="Phone Number"
							value={supplierForm.phone}
							onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
						/>
						<Input
							label="Email Address"
							type="email"
							value={supplierForm.email}
							onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
						/>
						<div>
							<label className="label">Payment Terms</label>
							<select
								className="input"
								value={supplierForm.paymentTerms}
								onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
							>
								<option value="immediate">Immediate / Cash on Delivery</option>
								<option value="net15">Net 15 Days</option>
								<option value="net30">Net 30 Days</option>
								<option value="net60">Net 60 Days</option>
							</select>
						</div>
						<div className="row row--space" style={{ marginTop: '1rem' }}>
							<Button type="button" variant="secondary" onClick={() => setSupplierModalOpen(false)}>
								Cancel
							</Button>
							<Button type="submit">Save Supplier</Button>
						</div>
					</form>
				</Modal>
			</div>
		</PlanGate>
	)
}
