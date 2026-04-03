import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table from '../../components/common/Table.jsx'
import ProductForm from '../../components/inventory/ProductForm.jsx'
import { deleteProduct, fetchProducts } from '../../store/slices/productSlice'
import categoryService from '../../services/categoryService'

export default function Products() {
	const dispatch = useDispatch()
	const { items, status, error } = useSelector((s) => s.products)
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState(null)
	const [categories, setCategories] = useState([])

	useEffect(() => {
		dispatch(fetchProducts())
		categoryService.getAll().then(setCategories).catch(() => setCategories([]))
	}, [dispatch])

	const columns = useMemo(
		() => [
			{ header: 'Name', key: 'name' },
			{ header: 'SKU', key: 'sku' },
			{ header: 'Price', key: 'price' },
			{ header: 'Stock', key: 'stock' },
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
							onClick={() => dispatch(deleteProduct(row.id))}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[dispatch],
	)

	return (
		<div className="stack">
			<div className="row row--space">
				<div className="muted">Manage products, pricing and stock.</div>
				<Button
					onClick={() => {
						setEditing(null)
						setOpen(true)
					}}
				>
					Add Product
				</Button>
			</div>

			{status === 'loading' ? <div className="card">Loading...</div> : null}
			{error ? <div className="card error">{error}</div> : null}

			<Table columns={columns} rows={items} />

			<Modal
				title={editing ? 'Edit Product' : 'Add Product'}
				open={open}
				onClose={() => setOpen(false)}
			>
				<ProductForm
					initial={editing}
					categories={categories}
					onDone={() => {
						setOpen(false)
						setEditing(null)
					}}
				/>
			</Modal>
		</div>
	)
}
