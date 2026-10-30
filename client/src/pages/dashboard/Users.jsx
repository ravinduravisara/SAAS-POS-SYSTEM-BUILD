import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import UserForm from '../../components/users/UserForm.jsx'
import userService from '../../services/userService'

export default function Users() {
	const [items, setItems] = useState([])
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)

	async function load() {
		setItems(await userService.getAll())
	}

	useEffect(() => {
		let active = true
		userService
			.getAll()
			.then((data) => {
				if (active) {
					setItems(data)
				}
			})
			.catch(() => {})
		return () => {
			active = false
		}
	}, [])

	const columns = useMemo(
		() => [
			{ header: 'Name', key: 'name' },
			{ header: 'Email', key: 'email' },
			{ header: 'Role', key: 'role' },
			{
				header: 'Actions',
				key: 'actions',
				render: (row) => (
					<div className="row">
						<Button
							variant="secondary"
							onClick={() => {
								setEditing(row)
								setOpen(true)
							}}
						>
							Edit
						</Button>
						<Button
							variant="secondary"
							onClick={async () => {
								await userService.remove(row.id)
								load()
							}}
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
			<div className="row row--space">
				<div className="muted">Manage staff users and roles.</div>
				<Button
					onClick={() => {
						setEditing(null)
						setOpen(true)
					}}
				>
					Add User
				</Button>
			</div>

			<Table columns={columns} rows={items} />

			<Modal
				title={editing ? 'Edit User' : 'Add User'}
				open={open}
				onClose={() => setOpen(false)}
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
		</div>
	)
}
