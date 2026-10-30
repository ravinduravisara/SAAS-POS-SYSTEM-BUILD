import { useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import categoryService from '../../services/categoryService'

export default function CategoryForm({ initial, onDone }) {
	const [prevInitial, setPrevInitial] = useState(initial)
	const [name, setName] = useState(initial?.name || '')

	if (initial !== prevInitial) {
		setPrevInitial(initial)
		setName(initial?.name || '')
	}

	async function onSubmit(e) {
		e.preventDefault()
		if (initial?.id) {
			await categoryService.update(initial.id, { name })
		} else {
			await categoryService.create({ name })
		}
		onDone?.()
	}

	return (
		<form className="stack" onSubmit={onSubmit}>
			<Input label="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
			<div className="row row--space">
				<div className="muted">{initial?.id ? 'Update category' : 'Create category'}</div>
				<Button type="submit">Save</Button>
			</div>
		</form>
	)
}
