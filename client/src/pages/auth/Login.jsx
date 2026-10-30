import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import { login } from '../../store/slices/authSlice'

export default function Login() {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation()
	const { token, status, error, isSuperAdmin } = useSelector((state) => state.auth)

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)

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
			<form className="card" onSubmit={onSubmit} style={{ padding: '32px' }}>
				<div style={{ textAlign: 'center', marginBottom: '8px' }}>
					<div
						style={{
							width: '44px',
							height: '44px',
							borderRadius: '10px',
							background: 'var(--primary)',
							color: '#ffffff',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontWeight: 800,
							fontSize: '1.25rem',
							marginBottom: '12px',
						}}
					>
						P
					</div>
					<h1 className="h1" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
						Welcome Back
					</h1>
					<p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem' }}>
						Sign in to your business workspace
					</p>
				</div>

				{error && (
					<div
						style={{
							padding: '10px 14px',
							background: 'var(--danger-light)',
							border: '1px solid #fecaca',
							color: 'var(--danger)',
							borderRadius: '6px',
							fontSize: '0.85rem',
							fontWeight: 500,
						}}
					>
						{error}
					</div>
				)}

				<div className="field">
					<label className="field__label" htmlFor="login-email">
						Business Email
					</label>
					<input
						id="login-email"
						type="email"
						className="input"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
						placeholder="name@company.com"
						required
					/>
				</div>

				<div className="field">
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<label className="field__label" htmlFor="login-password">
							Password
						</label>
						<Link
							to="/forgot-password"
							style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
						>
							Forgot password?
						</Link>
					</div>
					<div style={{ position: 'relative' }}>
						<input
							id="login-password"
							type={showPassword ? 'text' : 'password'}
							className="input"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							placeholder="Enter your account password"
							required
							style={{ paddingRight: '40px' }}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							style={{
								position: 'absolute',
								right: '10px',
								top: '50%',
								transform: 'translateY(-50%)',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								color: 'var(--muted)',
								fontSize: '0.9rem',
								padding: '4px',
							}}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? '👁️' : '🔒'}
						</button>
					</div>
				</div>

				<Button
					type="submit"
					loading={status === 'loading'}
					style={{ width: '100%', marginTop: '8px' }}
				>
					Sign In to Workspace
				</Button>

				<div
					style={{
						textAlign: 'center',
						fontSize: '0.75rem',
						color: 'var(--muted)',
						borderTop: '1px solid var(--border)',
						paddingTop: '16px',
						marginTop: '8px',
					}}
				>
					Enterprise Multi-Tenant SaaS POS + ERP. Onboarding is managed by SaaS Platform Administrators.
				</div>
			</form>
		</div>
	)
}
