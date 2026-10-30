import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import Input from '../../components/common/Input.jsx'
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
	const [form, setForm] = useState({
		title: '',
		category: 'Utilities',
		amount: '',
		paymentMethod: 'cash',
		notes: '',
	})

	useEffect(() => {
		let active = true
		expenseService
			.getAll()
			.then((data) => {
				if (active) {
					setExpenses(data)
					setLoading(false)
				}
			})
			.catch((e) => {
				if (active) {
					setError(e?.response?.data?.message || e?.message || 'Failed to load expenses')
					setLoading(false)
				}
			})
		return () => {
			active = false
		}
	}, [])

	async function reloadExpenses() {
		try {
			const data = await expenseService.getAll()
			setExpenses(data)
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to refresh')
		}
	}

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
			await reloadExpenses()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to record expense')
		}
	}

	const handleDelete = useCallback(async (id) => {
		if (!window.confirm('Delete this expense entry?')) return
		try {
			await expenseService.remove(id)
			await reloadExpenses()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to delete')
		}
	}, [])

	const totalExpenseAmount = useMemo(() => {
		return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
	}, [expenses])

	const columns = useMemo(
		() => [
			{ header: 'Expense Title', key: 'title' },
			{
				header: 'Category',
				key: 'category',
				render: (row) => (
					<span
						style={{
							padding: '3px 8px',
							borderRadius: '4px',
							fontSize: '0.8rem',
							backgroundColor: '#e0f2fe',
							color: '#0369a1',
							fontWeight: 'bold',
						}}
					>
						{row.category}
					</span>
				),
			},
			{
				header: 'Amount',
				key: 'amount',
				render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
			},
			{
				header: 'Payment Method',
				key: 'paymentMethod',
				render: (row) => (
					<span className="badge" style={{ textTransform: 'capitalize' }}>
						{row.paymentMethod}
					</span>
				),
			},
			{
				header: 'Date',
				key: 'createdAt',
				render: (row) => formatDate(row.createdAt),
			},
			{ header: 'Notes', key: 'notes' },
			{
				header: 'Actions',
				key: 'actions',
				render: (row) => (
					<Button
						variant="secondary"
						style={{ color: '#dc2626' }}
						onClick={() => handleDelete(row.id)}
					>
						Delete
					</Button>
				),
			},
		],
		[handleDelete],
	)

	return (
		<PlanGate feature="expenseManagement">
			<div className="stack">
				<div className="row row--space">
					<div>
						<h2 className="h2" style={{ margin: 0 }}>Business Expenses</h2>
						<div className="muted">Track operational overhead, utility payments, and petty cash.</div>
					</div>
					<Button onClick={() => setModalOpen(true)}>+ Record Expense</Button>
				</div>

				{error ? <div className="card error">{error}</div> : null}

				{/* Summary Cards */}
				<div className="grid grid--3">
					<div className="card">
						<div className="muted">Total Expenses Recorded</div>
						<div className="bold" style={{ fontSize: '1.4rem', color: '#b91c1c' }}>
							{formatCurrency(totalExpenseAmount)}
						</div>
					</div>
					<div className="card">
						<div className="muted">Expense Entries</div>
						<div className="bold" style={{ fontSize: '1.4rem' }}>
							{expenses.length}
						</div>
					</div>
					<div className="card">
						<div className="muted">Active Categories</div>
						<div className="bold" style={{ fontSize: '1.4rem', color: '#0369a1' }}>
							{new Set(expenses.map((e) => e.category)).size}
						</div>
					</div>
				</div>

				{loading ? (
					<div className="card muted">Loading expenses...</div>
				) : (
					<Table columns={columns} data={expenses} />
				)}

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
			</div>
		</PlanGate>
	)
}
