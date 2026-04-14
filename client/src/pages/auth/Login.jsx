import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { login } from '../../store/slices/authSlice'

export default function Login() {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation()
	const { token, status, error, isSuperAdmin } = useSelector((state) => state.auth)

	const [email, setEmail] = useState('admin@example.com')
	const [password, setPassword] = useState('admin')

	useEffect(() => {
		if (token) {
			const from = location.state?.from?.pathname
			const to = isSuperAdmin
				? '/super-admin'
				: (from?.startsWith('/super-admin') ? '/dashboard' : (from || '/dashboard'))
			navigate(to, { replace: true })
		}
	}, [token, isSuperAdmin, navigate, location.state])

	async function onSubmit(e) {
		e.preventDefault()
		dispatch(login({ email, password }))
	}

	return (
		<div className="auth">
			<form className="card" onSubmit={onSubmit}>
				<h1 className="h1">Login</h1>
				<Input
					label="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
					required
				/>
				<Input
					label="Password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="current-password"
					required
				/>

				{error ? <div className="error">{error}</div> : null}

				<Button type="submit" disabled={status === 'loading'}>
					{status === 'loading' ? 'Signing in...' : 'Sign in'}
				</Button>

				<div className="auth__links">
					<Link to="/forgot-password">Forgot password?</Link>
					<span className="muted">Accounts are created by platform super admins.</span>
				</div>
			</form>
		</div>
	)
}
