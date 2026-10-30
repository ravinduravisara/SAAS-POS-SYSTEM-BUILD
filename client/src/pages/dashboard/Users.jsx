import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import UserForm from '../../components/users/UserForm.jsx'
import userService from '../../services/userService'

export default function Users() {
	const [items, setItems] = useState([])
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [deleteTarget, setDeleteTarget] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')

	const load = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const data = await userService.getAll()
			setItems(data || [])
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load staff users')
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
			(u) =>
				u.name?.toLowerCase().includes(q) ||
				u.email?.toLowerCase().includes(q) ||
				u.role?.toLowerCase().includes(q),
		)
	}, [items, searchQuery])

	const stats = useMemo(() => {
		const total = items.length
		const admins = items.filter((u) => u.role === 'admin' || u.role === 'superadmin').length
		const managers = items.filter((u) => u.role === 'manager').length
		const cashiers = items.filter((u) => u.role === 'cashier').length
		return { total, admins, managers, cashiers }
	}, [items])

	async function confirmDelete() {
		if (!deleteTarget) return
		try {
			await userService.remove(deleteTarget.id)
			setDeleteTarget(null)
			await load()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to delete user')
		}
	}

	const columns = useMemo(
		() => [
			{
				label: 'Staff Member',
				key: 'name',
				render: (row) => (
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						<div
							style={{
								width: '34px',
								height: '34px',
								borderRadius: '50%',
								backgroundColor: row.role === 'admin' ? '#e0e7ff' : '#f1f5f9',
								color: row.role === 'admin' ? '#4338ca' : '#475569',
								fontWeight: 700,
								fontSize: '0.85rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{row.name ? row.name.charAt(0).toUpperCase() : 'U'}
						</div>
						<div>
							<div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
							<div style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.email}</div>
						</div>
					</div>
				),
			},
			{
				label: 'Assigned Role',
				key: 'role',
				render: (row) => {
					if (row.role === 'admin' || row.role === 'superadmin') {
						return <StatusBadge status="primary" label="Store Admin" />
					}
					if (row.role === 'manager') {
						return <StatusBadge status="warning" label="Store Manager" />
					}
					return <StatusBadge status="info" label="POS Cashier" />
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
		[],
	)

	return (
		<div className="stack">
			<PageHeader
				title="Team & User Management"
				subtitle="Manage staff accounts, assign operational roles, and configure system access permissions."
				actions={
					<Button
						onClick={() => {
							setEditing(null)
							setOpen(true)
						}}
					>
						+ Add Team Member
					</Button>
				}
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}

			{/* KPI Summary Cards */}
			<div className="grid grid--4">
				<StatCard
					label="Total Staff"
					value={stats.total}
					subtext="Active accounts"
					icon="👥"
				/>
				<StatCard
					label="Administrators"
					value={stats.admins}
					subtext="Full access privileges"
					icon="👑"
				/>
				<StatCard
					label="Managers"
					value={stats.managers}
					subtext="Store & stock oversight"
					icon="🛡️"
				/>
				<StatCard
					label="Cashiers"
					value={stats.cashiers}
					subtext="POS terminal access"
					icon="💼"
				/>
			</div>

			{/* Users Table */}
			<div className="card" style={{ padding: '1.25rem' }}>
				<DataTable
					columns={columns}
					data={filteredItems}
					loading={loading}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search staff by name, email, or role..."
					emptyTitle="No staff members found"
					emptyDescription="No users match your search query."
					emptyActionText="+ Add Team Member"
					onEmptyAction={() => {
						setEditing(null)
						setOpen(true)
					}}
				/>
			</div>

			{/* Add/Edit Modal */}
			<Modal
				title={editing ? 'Edit Team Member' : 'Add New Team Member'}
				open={open}
				onClose={() => {
					setOpen(false)
					setEditing(null)
				}}
			>
				<UserForm
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
				title="Remove Staff Account"
				message={`Are you sure you want to remove "${deleteTarget?.name}"? They will immediately lose access to this store workspace.`}
				confirmLabel="Remove User"
				isDanger={true}
				onConfirm={confirmDelete}
				onCancel={() => setDeleteTarget(null)}
			/>
		</div>
	)
}
