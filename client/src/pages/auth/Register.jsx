import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import authService from '../../services/authService'

export default function Register() {
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

	async function onSubmit(e) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await authService.register({ name, email, password })
			navigate('/login', { replace: true })
		} catch (err) {
			setError(err?.message || 'Registration failed')
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
