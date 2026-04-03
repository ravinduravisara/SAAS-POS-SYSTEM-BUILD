import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import userService from '../../services/userService'

export default function UserForm({ initial, onDone }) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [role, setRole] = useState('cashier')

	useEffect(() => {
		setName(initial?.name || '')
		setEmail(initial?.email || '')
		setRole(initial?.role || 'cashier')
	}, [initial])

	async function onSubmit(e) {
		e.preventDefault()
		const payload = { name, email, role }
		if (initial?.id) {
			await userService.update(initial.id, payload)
		} else {
			await userService.create(payload)
		}
		onDone?.()
	}

	return (
		<form className="stack" onSubmit={onSubmit}>
			<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
			<Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
			<label className="field">
				<span className="field__label">Role</span>
				<select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
					<option value="admin">admin</option>
					<option value="manager">manager</option>
					<option value="cashier">cashier</option>
				</select>
			</label>
			<div className="row row--space">
				<div className="muted">{initial?.id ? 'Update user' : 'Create user'}</div>
				<Button type="submit">Save</Button>
			</div>
		</form>
	)
}
