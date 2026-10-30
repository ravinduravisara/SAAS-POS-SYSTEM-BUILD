import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import CustomerForm from '../../components/customers/CustomerForm.jsx'
import customerService from '../../services/customerService'

export default function Customers() {
	const [items, setItems] = useState([])
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [deleteTarget, setDeleteTarget] = useState(null)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')

	const load = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const data = await customerService.getAll()
			setItems(data || [])
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load customers')
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
			(c) =>
				c.name?.toLowerCase().includes(q) ||
				c.phone?.toLowerCase().includes(q) ||
				c.email?.toLowerCase().includes(q),
		)
	}, [items, searchQuery])

	const stats = useMemo(() => {
		const total = items.length
		const withPhone = items.filter((c) => Boolean(c.phone)).length
		const withEmail = items.filter((c) => Boolean(c.email)).length
		return { total, withPhone, withEmail }
	}, [items])

	async function confirmDelete() {
		if (!deleteTarget) return
		try {
			await customerService.remove(deleteTarget.id)
			setDeleteTarget(null)
			await load()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to delete customer')
		}
	}

	const columns = useMemo(
		() => [
			{
				label: 'Customer',
				key: 'name',
				render: (row) => (
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						<div
							style={{
								width: '32px',
								height: '32px',
								borderRadius: '50%',
								backgroundColor: '#e0e7ff',
								color: '#4338ca',
								fontWeight: 700,
								fontSize: '0.85rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{row.name ? row.name.charAt(0).toUpperCase() : 'C'}
						</div>
						<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
					</div>
				),
			},
			{
				label: 'Phone Number',
				key: 'phone',
				render: (row) => (
					<span style={{ color: row.phone ? '#334155' : '#94a3b8' }}>
						{row.phone || '—'}
					</span>
				),
			},
			{
				label: 'Email Address',
				key: 'email',
				render: (row) => (
					<span style={{ color: row.email ? '#334155' : '#94a3b8' }}>
						{row.email || '—'}
					</span>
				),
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
		[],
	)

	return (
		<div className="stack">
			<PageHeader
				title="Customer Directory"
				subtitle="Manage client profiles, contact numbers, email addresses, and sales history."
				actions={
					<Button
						onClick={() => {
							setEditing(null)
							setOpen(true)
						}}
					>
						+ Add Customer
					</Button>
				}
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}

			{/* KPI Summary Cards */}
			<div className="grid grid--3">
				<StatCard
					label="Registered Customers"
					value={stats.total}
					subtext="Total client profiles"
					icon="👥"
				/>
				<StatCard
					label="Phone Contactable"
					value={stats.withPhone}
					subtext="SMS & WhatsApp enabled"
					icon="📱"
				/>
				<StatCard
					label="Email Contactable"
					value={stats.withEmail}
					subtext="Direct invoicing enabled"
					icon="✉️"
				/>
			</div>

			{/* Customers Table */}
			<div className="card" style={{ padding: '1.25rem' }}>
				<DataTable
					columns={columns}
					data={filteredItems}
					loading={loading}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search customer by name, phone, or email..."
					emptyTitle="No customers found"
					emptyDescription="No customer records have been created or match your search."
					emptyActionText="+ Add Customer"
					onEmptyAction={() => {
						setEditing(null)
						setOpen(true)
					}}
				/>
			</div>

			{/* Add / Edit Customer Modal */}
			<Modal
				title={editing ? 'Edit Customer' : 'Add New Customer'}
				open={open}
				onClose={() => {
					setOpen(false)
					setEditing(null)
				}}
			>
				<CustomerForm
					initial={editing}
					onDone={async () => {
						setOpen(false)
						setEditing(null)
						await load()
					}}
				/>
			</Modal>

			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				open={Boolean(deleteTarget)}
				title="Delete Customer Profile"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? Customer order records will remain for historical accounting.`}
				confirmLabel="Delete Customer"
				isDanger={true}
				onConfirm={confirmDelete}
				onCancel={() => setDeleteTarget(null)}
			/>
		</div>
	)
}
