import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input from '../../components/common/Input.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import PlanGate from '../../components/common/PlanGate.jsx'
import expenseService from '../../services/expenseService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const CATEGORIES = [
	'Utilities',
	'Rent',
	'Salaries & Wages',
	'Supplies',
	'Maintenance',
	'Logistics & Transport',
	'Marketing',
	'Meals & Refreshments',
	'General / Other',
]

export default function Expenses() {
	const [expenses, setExpenses] = useState([])
	const [modalOpen, setModalOpen] = useState(false)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [deleteTarget, setDeleteTarget] = useState(null)

	const [form, setForm] = useState({
		title: '',
		category: 'Utilities',
		amount: '',
		paymentMethod: 'cash',
		notes: '',
	})

	const loadExpenses = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const data = await expenseService.getAll()
			setExpenses(data || [])
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load expenses')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadExpenses()
	}, [loadExpenses])

	async function handleSubmit(e) {
		e.preventDefault()
		setError(null)
		try {
			const amount = Number(form.amount)
			if (Number.isNaN(amount) || amount <= 0) {
				setError('Valid positive amount is required')
				return
			}
			await expenseService.create({
				title: form.title,
				category: form.category,
				amount,
				paymentMethod: form.paymentMethod,
				notes: form.notes,
			})
			setModalOpen(false)
			setForm({
				title: '',
				category: 'Utilities',
				amount: '',
				paymentMethod: 'cash',
				notes: '',
			})
			await loadExpenses()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to record expense')
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return
		try {
			await expenseService.remove(deleteTarget.id)
			setDeleteTarget(null)
			await loadExpenses()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to delete expense')
		}
	}

	const totalExpenseAmount = useMemo(() => {
		return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
	}, [expenses])

	const filteredExpenses = useMemo(() => {
		if (!searchQuery.trim()) return expenses
		const q = searchQuery.toLowerCase()
		return expenses.filter(
			(e) =>
				e.title?.toLowerCase().includes(q) ||
				e.category?.toLowerCase().includes(q) ||
				e.notes?.toLowerCase().includes(q) ||
				e.paymentMethod?.toLowerCase().includes(q),
		)
	}, [expenses, searchQuery])

	const columns = useMemo(
		() => [
			{
				label: 'Expense Title',
				key: 'title',
				render: (row) => (
					<div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.title}</div>
						{row.notes && (
							<div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
								{row.notes}
							</div>
						)}
					</div>
				),
			},
			{
				label: 'Category',
				key: 'category',
				render: (row) => (
					<span
						style={{
							padding: '3px 8px',
							borderRadius: '6px',
							fontSize: '0.75rem',
							fontWeight: 600,
							backgroundColor: '#e0f2fe',
							color: '#0369a1',
						}}
					>
						{row.category}
					</span>
				),
			},
			{
				label: 'Amount',
				key: 'amount',
				render: (row) => (
					<span style={{ fontWeight: 700, color: '#b91c1c' }}>
						{formatCurrency(row.amount)}
					</span>
				),
			},
			{
				label: 'Payment Method',
				key: 'paymentMethod',
				render: (row) => (
					<StatusBadge
						status={row.paymentMethod === 'cash' ? 'info' : 'default'}
						label={row.paymentMethod?.replace('_', ' ')}
					/>
				),
			},
			{
				label: 'Date',
				key: 'createdAt',
				render: (row) => (
					<span style={{ fontSize: '0.85rem', color: '#64748b' }}>
						{formatDate(row.createdAt)}
					</span>
				),
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '100px',
				render: (row) => (
					<Button
						variant="secondary"
						size="sm"
						style={{ color: '#dc2626' }}
						onClick={() => setDeleteTarget(row)}
					>
						Delete
					</Button>
				),
			},
		],
		[],
	)

	return (
		<PlanGate feature="expenseManagement">
			<div className="stack">
				<PageHeader
					title="Business Expenses"
					subtitle="Track operational overhead, utility payments, vendor bills, and petty cash."
					actions={
						<Button onClick={() => setModalOpen(true)}>+ Record Expense</Button>
					}
				/>

				{error && (
					<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
						{error}
					</div>
				)}

				{/* Summary KPI Cards */}
				<div className="grid grid--3">
					<StatCard
						label="Total Expenses"
						value={formatCurrency(totalExpenseAmount)}
						subtext="All recorded overhead"
						icon="💸"
					/>
					<StatCard
						label="Total Entries"
						value={expenses.length}
						subtext="Recorded transactions"
						icon="🧾"
					/>
					<StatCard
						label="Active Categories"
						value={new Set(expenses.map((e) => e.category)).size}
						subtext="Expense categories"
						icon="🏷️"
					/>
				</div>

				{/* Expenses DataTable */}
				<div className="card" style={{ padding: '1.25rem' }}>
					<DataTable
						columns={columns}
						data={filteredExpenses}
						loading={loading}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search expense by title, category, or notes..."
						emptyTitle="No expenses found"
						emptyDescription="No business expenses have been recorded yet or match your search."
						emptyActionText="+ Record Expense"
						onEmptyAction={() => setModalOpen(true)}
					/>
				</div>

				{/* Record Expense Modal */}
				<Modal
					title="Record Business Expense"
					open={modalOpen}
					onClose={() => setModalOpen(false)}
				>
					<form className="stack" onSubmit={handleSubmit}>
						<Input
							label="Expense Title / Description"
							placeholder="e.g. October Electricity Bill, Store Supplies"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							required
						/>
						<div>
							<label className="label">Category</label>
							<select
								className="input"
								value={form.category}
								onChange={(e) => setForm({ ...form, category: e.target.value })}
							>
								{CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>
						<Input
							label="Amount"
							type="number"
							step="0.01"
							min="0.01"
							placeholder="0.00"
							value={form.amount}
							onChange={(e) => setForm({ ...form, amount: e.target.value })}
							required
						/>
						<div>
							<label className="label">Payment Source</label>
							<select
								className="input"
								value={form.paymentMethod}
								onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
							>
								<option value="cash">Cash / Petty Cash Register</option>
								<option value="bank_transfer">Bank Transfer / Cheque</option>
								<option value="card">Company Debit / Credit Card</option>
							</select>
						</div>
						<Input
							label="Reference / Notes"
							placeholder="Receipt #, vendor notes, etc."
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
						/>
						<div className="row row--space" style={{ marginTop: '1rem' }}>
							<Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
								Cancel
							</Button>
							<Button type="submit">Save Expense</Button>
						</div>
					</form>
				</Modal>

				{/* Confirm Delete Dialog */}
				<ConfirmDialog
					open={Boolean(deleteTarget)}
					title="Delete Expense Entry"
					message={`Are you sure you want to delete "${deleteTarget?.title}" (${formatCurrency(deleteTarget?.amount || 0)})? This action cannot be undone.`}
					confirmLabel="Delete"
					isDanger={true}
					onConfirm={confirmDelete}
					onCancel={() => setDeleteTarget(null)}
				/>
			</div>
		</PlanGate>
	)
}
