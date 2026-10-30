import { useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import customerService from '../../services/customerService'

export default function CustomerForm({ initial, onDone }) {
	const [prevInitial, setPrevInitial] = useState(initial)
	const [name, setName] = useState(initial?.name || '')
	const [phone, setPhone] = useState(initial?.phone || '')
	const [email, setEmail] = useState(initial?.email || '')

	if (initial !== prevInitial) {
		setPrevInitial(initial)
		setName(initial?.name || '')
		setPhone(initial?.phone || '')
		setEmail(initial?.email || '')
	}

	async function onSubmit(e) {
		e.preventDefault()
		const payload = { name, phone, email }
		if (initial?.id) {
			await customerService.update(initial.id, payload)
		} else {
			await customerService.create(payload)
		}
		onDone?.()
	}

	return (
		<form className="stack" onSubmit={onSubmit}>
			<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
			<Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
			<Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
			<div className="row row--space">
				<div className="muted">{initial?.id ? 'Update customer' : 'Create customer'}</div>
				<Button type="submit">Save</Button>
			</div>
		</form>
	)
}
