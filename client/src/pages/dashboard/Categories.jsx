import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import CategoryForm from '../../components/inventory/CategoryForm.jsx'
import categoryService from '../../services/categoryService'

export default function Categories() {
	const [categories, setCategories] = useState([])
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [error, setError] = useState(null)

	async function load() {
		try {
			setError(null)
			setCategories(await categoryService.getAll())
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load categories')
		}
	}

	useEffect(() => {
		let active = true
		categoryService
			.getAll()
			.then((data) => {
				if (active) {
					setCategories(data)
					setError(null)
				}
			})
			.catch((e) => {
				if (active) setError(e?.response?.data?.message || e?.message || 'Failed to load categories')
			})
		return () => {
			active = false
		}
	}, [])

	const columns = useMemo(
		() => [
			{ header: 'Name', key: 'name' },
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
								await categoryService.remove(row.id)
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
				<div className="muted">Maintain product categories.</div>
				<Button
					onClick={() => {
						setEditing(null)
						setOpen(true)
					}}
				>
					Add Category
				</Button>
			</div>

			{error ? <div className="card error">{error}</div> : null}
			<Table columns={columns} rows={categories} />

			<Modal
				title={editing ? 'Edit Category' : 'Add Category'}
				open={open}
				onClose={() => setOpen(false)}
			>
				<CategoryForm
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
