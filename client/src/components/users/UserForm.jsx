import { useState } from 'react'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import userService from '../../services/userService'

export default function UserForm({ initial, onDone }) {
	const [prevInitial, setPrevInitial] = useState(initial)
	const [name, setName] = useState(initial?.name || '')
	const [email, setEmail] = useState(initial?.email || '')
	const [password, setPassword] = useState('')
	const [role, setRole] = useState(initial?.role || 'cashier')
	const [error, setError] = useState(null)

	if (initial !== prevInitial) {
		setPrevInitial(initial)
		setName(initial?.name || '')
		setEmail(initial?.email || '')
		setPassword('')
		setRole(initial?.role || 'cashier')
	}

	async function onSubmit(e) {
		e.preventDefault()
		setError(null)
		try {
			const payload = { name, email, role }
			if (password) payload.password = password
			if (initial?.id) {
				await userService.update(initial.id, payload)
			} else {
				if (!password || password.length < 8) {
					setError('Password must be at least 8 characters long')
					return
				}
				await userService.create(payload)
			}
			onDone?.()
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Action failed')
		}
	}

	return (
		<form className="stack" onSubmit={onSubmit}>
			{error ? <div className="card card--error" style={{ color: 'red' }}>{error}</div> : null}
			<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
			<Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
			<Input
				label={initial?.id ? 'New Password (leave blank to keep current)' : 'Password (min 8 chars)'}
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required={!initial?.id}
			/>
			<label className="field">
				<span className="field__label">Role</span>
				<select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
					<option value="admin">Admin</option>
					<option value="manager">Manager</option>
					<option value="cashier">Cashier</option>
				</select>
			</label>
			<div className="row row--space">
				<div className="muted">{initial?.id ? 'Update user' : 'Create user'}</div>
				<Button type="submit">Save</Button>
			</div>
		</form>
	)
}
