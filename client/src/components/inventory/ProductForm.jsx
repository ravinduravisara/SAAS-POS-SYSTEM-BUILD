import { useState } from 'react'
import { useDispatch } from 'react-redux'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import { createProduct, updateProduct } from '../../store/slices/productSlice'

export default function ProductForm({ initial, categories = [], onDone }) {
	const dispatch = useDispatch()
	const [prevInitial, setPrevInitial] = useState(initial)
	const [name, setName] = useState(initial?.name || '')
	const [sku, setSku] = useState(initial?.sku || '')
	const [price, setPrice] = useState(Number(initial?.price || 0))
	const [stock, setStock] = useState(Number(initial?.stock || 0))
	const [categoryId, setCategoryId] = useState(initial?.categoryId || '')

	if (initial !== prevInitial) {
		setPrevInitial(initial)
		setName(initial?.name || '')
		setSku(initial?.sku || '')
		setPrice(Number(initial?.price || 0))
		setStock(Number(initial?.stock || 0))
		setCategoryId(initial?.categoryId || '')
	}

	async function onSubmit(e) {
		e.preventDefault()
		const payload = { name, sku, price: Number(price || 0), stock: Number(stock || 0), categoryId: categoryId || null }
		if (initial?.id) {
			await dispatch(updateProduct({ id: initial.id, payload }))
		} else {
			await dispatch(createProduct(payload))
		}
		onDone?.()
	}

	return (
		<form className="stack" onSubmit={onSubmit}>
			<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
			<Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
			<Input
				label="Price"
				type="number"
				step="0.01"
				value={price}
				onChange={(e) => setPrice(e.target.value)}
				required
			/>
			<Input
				label="Stock"
				type="number"
				step="1"
				value={stock}
				onChange={(e) => setStock(e.target.value)}
				required
			/>
			<div>
				<label className="label">Category</label>
				<select
					className="input"
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
				>
					<option value="">(None)</option>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</select>
			</div>
			<div className="row row--space">
				<div className="muted">{initial?.id ? 'Update product' : 'Create product'}</div>
				<Button type="submit">Save</Button>
			</div>
		</form>
	)
}
