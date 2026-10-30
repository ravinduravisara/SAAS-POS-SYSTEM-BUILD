import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import salesService from '../../services/salesService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function Sales() {
	const [sales, setSales] = useState([])
	const [selectedSale, setSelectedSale] = useState(null)
	const [refundModalOpen, setRefundModalOpen] = useState(false)
	const [refundReason, setRefundReason] = useState('')
	const [restock, setRestock] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [refunding, setRefunding] = useState(false)

	useEffect(() => {
		let active = true
		salesService
			.list()
			.then((data) => {
				if (active) {
					setSales(data || [])
					setLoading(false)
				}
			})
			.catch((e) => {
				if (active) {
					setError(e?.response?.data?.message || e?.message || 'Failed to load sales')
					setLoading(false)
				}
			})
		return () => {
			active = false
		}
	}, [])

	async function refreshSales() {
		try {
			setLoading(true)
			const data = await salesService.list()
			setSales(data || [])
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to refresh sales')
		} finally {
			setLoading(false)
		}
	}

	async function handleRefund() {
		if (!selectedSale) return
		setRefunding(true)
		try {
			await salesService.refundSale(selectedSale.id, {
				reason: refundReason || 'Customer return',
				restock,
			})
			setRefundModalOpen(false)
			setSelectedSale(null)
			setRefundReason('')
			await refreshSales()
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Refund failed')
		} finally {
			setRefunding(false)
		}
	}

	function handlePrintReceipt(sale) {
		const printWindow = window.open('', '_blank', 'width=400,height=600')
		if (!printWindow) return

		const receiptHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Receipt #${sale.id}</title>
				<style>
					body { font-family: monospace; font-size: 13px; padding: 15px; margin: 0; line-height: 1.4; color: #000; }
					.center { text-align: center; }
					.divider { border-top: 1px dashed #000; margin: 10px 0; }
					.row { display: flex; justify-content: space-between; }
					.bold { font-weight: bold; }
				</style>
			</head>
			<body>
				<div class="center bold" style="font-size: 16px;">SAAS POS & ERP PLATFORM</div>
				<div class="center">Official Sales Receipt</div>
				<div class="divider"></div>
				<div class="row"><span>Sale ID:</span><span>${sale.id}</span></div>
				<div class="row"><span>Date:</span><span>${formatDate(sale.createdAt)}</span></div>
				<div class="row"><span>Customer:</span><span>${sale.customerName || 'Walk-in'}</span></div>
				<div class="row"><span>Status:</span><span class="bold">${String(sale.status || 'completed').toUpperCase()}</span></div>
				<div class="divider"></div>
				<div class="bold" style="margin-bottom: 5px;">ITEMS:</div>
				${(sale.items || [])
					.map(
						(i) => `
					<div class="row">
						<span>${i.name} x${i.quantity}</span>
						<span>${formatCurrency(i.totalAmount || i.price * i.quantity)}</span>
					</div>`
					)
					.join('')}
				<div class="divider"></div>
				<div class="row"><span>Subtotal:</span><span>${formatCurrency(sale.totals?.subtotal || 0)}</span></div>
				<div class="row"><span>Tax:</span><span>${formatCurrency(sale.totals?.taxTotal || 0)}</span></div>
				<div class="row bold" style="font-size: 15px;"><span>TOTAL:</span><span>${formatCurrency(sale.totals?.total || 0)}</span></div>
				<div class="row"><span>Paid (${sale.payment?.method || 'cash'}):</span><span>${formatCurrency(sale.payment?.paid || 0)}</span></div>
				<div class="row"><span>Change:</span><span>${formatCurrency(sale.payment?.change || 0)}</span></div>
				<div class="divider"></div>
				<div class="center" style="font-size: 11px; margin-top: 10px;">Thank you for your business!</div>
				<script>
					window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
				</script>
			</body>
			</html>
		`
		printWindow.document.write(receiptHtml)
		printWindow.document.close()
	}

	const filteredSales = useMemo(() => {
		return sales.filter((s) => {
			const matchesStatus = statusFilter === 'all' || s.status === statusFilter
			const matchesSearch =
				!searchQuery ||
				s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
			return matchesStatus && matchesSearch
		})
	}, [sales, statusFilter, searchQuery])

	const columns = [
		{
			key: 'id',
			label: 'Sale Identifier',
			render: (row) => (
				<div>
					<div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.id.slice(0, 10)}...</div>
					<div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDate(row.createdAt)}</div>
				</div>
			),
		},
		{
			key: 'customer',
			label: 'Customer',
			render: (row) => <span>{row.customerName || 'Walk-in Customer'}</span>,
		},
		{
			key: 'itemsCount',
			label: 'Items',
			render: (row) => (
				<span>
					{row.items?.length || row.totals?.itemsCount || 1} item{row.items?.length === 1 ? '' : 's'}
				</span>
			),
		},
		{
			key: 'total',
			label: 'Total Amount',
			render: (row) => <strong style={{ color: 'var(--text)' }}>{formatCurrency(row.totals?.total || 0)}</strong>,
		},
		{
			key: 'paymentMethod',
			label: 'Payment Method',
			render: (row) => (
				<span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
					{row.payment?.method || 'Cash'}
				</span>
			),
		},
		{
			key: 'status',
			label: 'Status',
			render: (row) => <StatusBadge status={row.status || 'completed'} />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (row) => (
				<div style={{ display: 'flex', gap: '6px' }}>
					<Button variant="secondary" size="sm" onClick={() => setSelectedSale(row)}>
						Inspect
					</Button>
					<Button variant="secondary" size="sm" onClick={() => handlePrintReceipt(row)}>
						Receipt
					</Button>
				</div>
			),
		},
	]

	return (
		<div>
			<PageHeader
				title="Sales Ledger & Receipts"
				subtitle="Search sales history, view printable receipts, and issue inventory-restocked refunds."
				actions={
					<Button variant="secondary" onClick={refreshSales}>
						↻ Refresh Ledger
					</Button>
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

			{/* Filter Tabs */}
			<div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
					<span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Status:</span>
					{['all', 'completed', 'refunded'].map((st) => (
						<button
							key={st}
							type="button"
							className={`btn btn--sm ${statusFilter === st ? 'btn--primary' : 'btn--secondary'}`}
							onClick={() => setStatusFilter(st)}
							style={{ textTransform: 'capitalize', borderRadius: '9999px' }}
						>
							{st}
						</button>
					))}
				</div>
			</div>

			<DataTable
				columns={columns}
				data={filteredSales}
				loading={loading}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				searchPlaceholder="Search by Sale ID or customer..."
				emptyTitle="No sales found"
				emptyDescription="No sales match your current search or status filter."
			/>

			{/* Inspect Sale Modal */}
			{selectedSale && !refundModalOpen && (
				<Modal
					open={true}
					onClose={() => setSelectedSale(null)}
					title={`Sale Details #${selectedSale.id.slice(0, 8)}`}
					maxWidth="560px"
					footer={
						<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<Button variant="secondary" onClick={() => handlePrintReceipt(selectedSale)}>
								🖨️ Print Receipt
							</Button>
							{selectedSale.status !== 'refunded' ? (
								<Button
									variant="danger"
									onClick={() => setRefundModalOpen(true)}
								>
									Issue Refund
								</Button>
							) : (
								<span className="badge badge--danger">Already Refunded</span>
							)}
						</div>
					}
				>
					<div className="stack" style={{ gap: '14px' }}>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
							<div>Customer: <strong>{selectedSale.customerName || 'Walk-in'}</strong></div>
							<div>Date: <strong>{formatDate(selectedSale.createdAt)}</strong></div>
							<div>Payment Method: <strong style={{ textTransform: 'capitalize' }}>{selectedSale.payment?.method || 'Cash'}</strong></div>
							<div>Status: <StatusBadge status={selectedSale.status} /></div>
						</div>

						<div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
							<div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Line Items:</div>
							{(selectedSale.items || []).map((item, idx) => (
								<div
									key={idx}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										fontSize: '0.85rem',
										padding: '4px 0',
										borderBottom: '1px solid #f1f5f9',
									}}
								>
									<span>
										<strong>{item.quantity}x</strong> {item.name}
									</span>
									<span>{formatCurrency(item.totalAmount || item.price * item.quantity)}</span>
								</div>
							))}
						</div>

						<div
							style={{
								background: '#f8fafc',
								padding: '12px',
								borderRadius: '6px',
								fontSize: '0.875rem',
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
								<span className="muted">Subtotal</span>
								<span>{formatCurrency(selectedSale.totals?.subtotal || 0)}</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
								<span className="muted">Tax</span>
								<span>{formatCurrency(selectedSale.totals?.taxTotal || 0)}</span>
							</div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									fontWeight: 700,
									fontSize: '1rem',
									borderTop: '1px solid var(--border)',
									paddingTop: '6px',
									marginTop: '4px',
								}}
							>
								<span>Total Paid</span>
								<span style={{ color: 'var(--primary)' }}>
									{formatCurrency(selectedSale.totals?.total || 0)}
								</span>
							</div>
						</div>
					</div>
				</Modal>
			)}

			{/* Refund Modal */}
			{refundModalOpen && selectedSale && (
				<Modal
					open={true}
					onClose={() => setRefundModalOpen(false)}
					title="Process Refund & Restock"
					maxWidth="460px"
					footer={
						<>
							<Button variant="secondary" onClick={() => setRefundModalOpen(false)} disabled={refunding}>
								Cancel
							</Button>
							<Button variant="danger" onClick={handleRefund} loading={refunding}>
								Confirm Refund ({formatCurrency(selectedSale.totals?.total || 0)})
							</Button>
						</>
					}
				>
					<div className="stack" style={{ gap: '14px' }}>
						<p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
							Refunding Sale <strong>#{selectedSale.id.slice(0, 8)}</strong> will mark the transaction as refunded and can restock the items into inventory.
						</p>

						<div className="field">
							<label className="field__label">Reason for Return *</label>
							<input
								type="text"
								className="input"
								placeholder="e.g. Defective item, customer changed mind"
								value={refundReason}
								onChange={(e) => setRefundReason(e.target.value)}
								required
							/>
						</div>

						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
							<input
								type="checkbox"
								checked={restock}
								onChange={(e) => setRestock(e.target.checked)}
							/>
							<span>Automatically restock items into product inventory balances</span>
						</label>
					</div>
				</Modal>
			)}
		</div>
	)
}
