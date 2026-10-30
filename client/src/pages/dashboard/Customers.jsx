import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import CustomerForm from '../../components/customers/CustomerForm.jsx'
import customerService from '../../services/customerService'

export default function Customers() {
	const [items, setItems] = useState([])
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [error, setError] = useState(null)

	async function load() {
		try {
			setError(null)
			setItems(await customerService.getAll())
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load customers')
		}
	}

	useEffect(() => {
		let active = true
		customerService
			.getAll()
			.then((data) => {
				if (active) {
					setItems(data)
					setError(null)
				}
			})
			.catch((e) => {
				if (active) setError(e?.response?.data?.message || e?.message || 'Failed to load customers')
			})
		return () => {
			active = false
		}
	}, [])

	const columns = useMemo(
		() => [
			{ header: 'Name', key: 'name' },
			{ header: 'Phone', key: 'phone' },
			{ header: 'Email', key: 'email' },
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
								await customerService.remove(row.id)
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
				<div className="muted">Maintain your customer list.</div>
				<Button
					onClick={() => {
						setEditing(null)
						setOpen(true)
					}}
				>
					Add Customer
				</Button>
			</div>

			{error ? <div className="card error">{error}</div> : null}
			<Table columns={columns} rows={items} />

			<Modal
				title={editing ? 'Edit Customer' : 'Add Customer'}
				open={open}
				onClose={() => setOpen(false)}
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
		</div>
	)
}
