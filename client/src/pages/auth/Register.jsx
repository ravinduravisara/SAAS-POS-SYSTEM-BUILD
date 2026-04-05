import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import authService from '../../services/authService'
import { setSession } from '../../store/slices/authSlice'

export default function Register() {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [storeName, setStoreName] = useState('')
	const [plan, setPlan] = useState('starter')
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

	async function onSubmit(e) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			const data = await authService.register({ name, email, password, storeName, plan })
			dispatch(setSession(data))
			navigate('/dashboard', { replace: true })
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Registration failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="auth">
			<form className="card" onSubmit={onSubmit}>
				<h1 className="h1">Register</h1>
				<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
				<Input
					label="Store Name"
					value={storeName}
					onChange={(e) => setStoreName(e.target.value)}
				/>
				<Input
					label="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<Input
					label="Password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<label className="field">
					<span className="field__label">Plan</span>
					<select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
						<option value="starter">Starter - $9.99/month</option>
						<option value="pro">Pro - $29.99/month</option>
						<option value="enterprise">Enterprise - $99.99/month</option>
					</select>
					<div className="muted">Starter for small shops, Pro for growing teams, Enterprise for multi-location businesses.</div>
				</label>

				{error ? <div className="error">{error}</div> : null}

				<Button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create account'}
				</Button>
				<div className="auth__links">
					<Link to="/login">Back to login</Link>
				</div>
			</form>
		</div>
	)
}
