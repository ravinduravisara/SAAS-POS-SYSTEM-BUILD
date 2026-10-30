import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import Input from '../../components/common/Input.jsx'
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

	useEffect(() => {
		let active = true
		salesService
			.list()
			.then((data) => {
				if (active) {
					setSales(data)
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
			const data = await salesService.list()
			setSales(data)
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to refresh sales')
		}
	}

	async function handleRefund() {
		if (!selectedSale) return
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
					body { font-family: monospace; font-size: 13px; padding: 15px; margin: 0; line-height: 1.4; }
					.center { text-align: center; }
					.divider { border-top: 1px dashed #000; margin: 10px 0; }
					.row { display: flex; justify-content: space-between; }
					.bold { font-weight: bold; }
					.text-right { text-align: right; }
				</style>
			</head>
			<body>
				<div class="center bold" style="font-size: 16px;">UNIVERSAL POS PLATFORM</div>
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
					</div>
				`,
					)
					.join('')}
				<div class="divider"></div>
				<div class="row"><span>Subtotal:</span><span>${formatCurrency(sale.totals?.subtotal)}</span></div>
				${sale.totals?.discountTotal > 0 ? `<div class="row"><span>Discount:</span><span>-${formatCurrency(sale.totals?.discountTotal)}</span></div>` : ''}
				<div class="row"><span>Tax:</span><span>${formatCurrency(sale.totals?.taxTotal)}</span></div>
				<div class="row bold" style="font-size: 15px;"><span>TOTAL:</span><span>${formatCurrency(sale.totals?.total)}</span></div>
				<div class="divider"></div>
				<div class="row"><span>Payment (${sale.payment?.method || 'cash'}):</span><span>${formatCurrency(sale.payment?.paid)}</span></div>
				${sale.payment?.change > 0 ? `<div class="row"><span>Change:</span><span>${formatCurrency(sale.payment?.change)}</span></div>` : ''}
				<div class="divider"></div>
				<div class="center">Thank you for your business!</div>
				<script>
					window.onload = function() { window.print(); }
				</script>
			</body>
			</html>
		`
		printWindow.document.write(receiptHtml)
		printWindow.document.close()
	}

	const filteredSales = useMemo(() => {
		return sales.filter((s) => {
			const matchesQuery =
				!searchQuery ||
				String(s.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
				String(s.customerName || '').toLowerCase().includes(searchQuery.toLowerCase())
			const matchesStatus = statusFilter === 'all' || s.status === statusFilter
			return matchesQuery && matchesStatus
		})
	}, [sales, searchQuery, statusFilter])

	const columns = useMemo(
		() => [
			{ header: 'Sale ID', key: 'id' },
			{
				header: 'Date',
				key: 'createdAt',
				render: (row) => formatDate(row.createdAt),
			},
			{ header: 'Customer', key: 'customerName' },
			{
				header: 'Items',
				key: 'itemsCount',
				render: (row) => row.totals?.itemsCount || row.items?.length || 0,
			},
			{
				header: 'Total',
				key: 'total',
				render: (row) => <strong>{formatCurrency(row.totals?.total || 0)}</strong>,
			},
			{
				header: 'Payment',
				key: 'paymentMethod',
				render: (row) => (
					<span className="badge" style={{ textTransform: 'capitalize' }}>
						{row.payment?.method || 'cash'}
					</span>
				),
			},
			{
				header: 'Status',
				key: 'status',
				render: (row) => {
					const isRefunded = row.status === 'refunded'
					return (
						<span
							style={{
								padding: '3px 8px',
								borderRadius: '4px',
								fontSize: '0.8rem',
								fontWeight: 'bold',
								backgroundColor: isRefunded ? '#fee2e2' : '#dcfce7',
								color: isRefunded ? '#991b1b' : '#166534',
							}}
						>
							{String(row.status || 'completed').toUpperCase()}
						</span>
					)
				},
			},
			{
				header: 'Actions',
				key: 'actions',
				render: (row) => (
					<div className="row" style={{ gap: '0.5rem' }}>
						<Button
							variant="secondary"
							onClick={() => setSelectedSale(row)}
						>
							View
						</Button>
						<Button
							variant="secondary"
							onClick={() => handlePrintReceipt(row)}
						>
							Receipt
						</Button>
					</div>
				),
			},
		],
		[],
	)

	return (
		<div className="stack">
			<div className="row row--space">
				<div>
					<h2 className="h2" style={{ margin: 0 }}>Sales History</h2>
					<div className="muted">View customer orders, receipts, and process refunds.</div>
				</div>
				<Button variant="secondary" onClick={refreshSales}>
					Refresh
				</Button>
			</div>

			{error ? <div className="card error">{error}</div> : null}

			<div className="card">
				<div className="row row--space" style={{ gap: '1rem', flexWrap: 'wrap' }}>
					<Input
						placeholder="Search by Sale ID or Customer..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						style={{ minWidth: '280px' }}
					/>
					<div className="row" style={{ gap: '0.5rem' }}>
						<span className="muted" style={{ alignSelf: 'center' }}>Filter:</span>
						<select
							className="input"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="all">All Statuses</option>
							<option value="completed">Completed</option>
							<option value="refunded">Refunded</option>
						</select>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="card muted">Loading sales history...</div>
			) : (
				<Table columns={columns} data={filteredSales} />
			)}

			{/* Detailed Sale Modal */}
			<Modal
				title={`Sale #${selectedSale?.id || ''}`}
				open={Boolean(selectedSale && !refundModalOpen)}
				onClose={() => setSelectedSale(null)}
			>
				{selectedSale ? (
					<div className="stack">
						<div className="row row--space">
							<div>
								<div className="muted">Customer: {selectedSale.customerName}</div>
								<div className="muted">Date: {formatDate(selectedSale.createdAt)}</div>
							</div>
							<div>
								<span
									style={{
										padding: '4px 10px',
										borderRadius: '4px',
										fontSize: '0.85rem',
										fontWeight: 'bold',
										backgroundColor: selectedSale.status === 'refunded' ? '#fee2e2' : '#dcfce7',
										color: selectedSale.status === 'refunded' ? '#991b1b' : '#166534',
									}}
								>
									{String(selectedSale.status).toUpperCase()}
								</span>
							</div>
						</div>

						<h4 className="h4" style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>Line Items</h4>
						<table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
							<thead>
								<tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
									<th>Product</th>
									<th>Price</th>
									<th>Qty</th>
									<th style={{ textAlign: 'right' }}>Total</th>
								</tr>
							</thead>
							<tbody>
								{(selectedSale.items || []).map((item, idx) => (
									<tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
										<td>{item.name}</td>
										<td>{formatCurrency(item.price)}</td>
										<td>{item.quantity}</td>
										<td style={{ textAlign: 'right' }}>
											{formatCurrency(item.totalAmount || item.price * item.quantity)}
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className="stack" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
							<div className="row row--space">
								<span className="muted">Subtotal:</span>
								<span>{formatCurrency(selectedSale.totals?.subtotal)}</span>
							</div>
							{selectedSale.totals?.discountTotal > 0 ? (
								<div className="row row--space">
									<span className="muted">Discount:</span>
									<span>-{formatCurrency(selectedSale.totals?.discountTotal)}</span>
								</div>
							) : null}
							<div className="row row--space">
								<span className="muted">Tax:</span>
								<span>{formatCurrency(selectedSale.totals?.taxTotal)}</span>
							</div>
							<div className="row row--space" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
								<span>Grand Total:</span>
								<span>{formatCurrency(selectedSale.totals?.total)}</span>
							</div>
							<div className="row row--space" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
								<span className="muted">Paid via {selectedSale.payment?.method}:</span>
								<span>{formatCurrency(selectedSale.payment?.paid)}</span>
							</div>
							{selectedSale.payment?.change > 0 ? (
								<div className="row row--space">
									<span className="muted">Change:</span>
									<span>{formatCurrency(selectedSale.payment?.change)}</span>
								</div>
							) : null}
						</div>

						<div className="row row--space" style={{ marginTop: '1rem' }}>
							<Button variant="secondary" onClick={() => handlePrintReceipt(selectedSale)}>
								Print Receipt
							</Button>
							{selectedSale.status !== 'refunded' ? (
								<Button
									variant="danger"
									style={{ backgroundColor: '#dc2626', color: '#fff' }}
									onClick={() => setRefundModalOpen(true)}
								>
									Refund Sale
								</Button>
							) : null}
						</div>
					</div>
				) : null}
			</Modal>

			{/* Refund Confirmation Modal */}
			<Modal
				title="Confirm Sale Refund"
				open={refundModalOpen}
				onClose={() => setRefundModalOpen(false)}
			>
				<div className="stack">
					<div className="muted">
						Are you sure you want to refund Sale #{selectedSale?.id}? Total amount:{' '}
						<strong>{formatCurrency(selectedSale?.totals?.total || 0)}</strong>
					</div>
					<Input
						label="Refund Reason"
						placeholder="e.g. Defective item, customer return"
						value={refundReason}
						onChange={(e) => setRefundReason(e.target.value)}
					/>
					<label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={restock}
							onChange={(e) => setRestock(e.target.checked)}
						/>
						<span>Restock items back into inventory</span>
					</label>
					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button variant="secondary" onClick={() => setRefundModalOpen(false)}>
							Cancel
						</Button>
						<Button
							style={{ backgroundColor: '#dc2626', color: '#fff' }}
							onClick={handleRefund}
						>
							Confirm Refund
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
