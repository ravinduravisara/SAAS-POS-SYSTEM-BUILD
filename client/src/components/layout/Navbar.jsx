import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import Button from '../common/Button.jsx'

export default function Navbar({ onMenu }) {
	const dispatch = useDispatch()
	const user = useSelector((state) => state.auth.user)
	const tenant = useSelector((state) => state.auth.tenant)
	const subscription = useSelector((state) => state.auth.subscription)
	const plan = tenant?.plan || subscription?.plan || 'starter'
	const trialEndsAt = tenant?.trialEndsAt || subscription?.trialEndsAt
	const trialDays = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

	return (
		<div>
			{trialDays !== null && trialDays > 0 && subscription?.status === 'trial' ? (
				<div className="card" style={{ marginBottom: '1rem' }}>
					<div className="row row--space">
						<strong>Trial ends in {trialDays} day{trialDays === 1 ? '' : 's'}</strong>
						<span className="muted">Upgrade now to keep access</span>
					</div>
				</div>
			) : null}
			<div className="navbar">
				<div className="navbar__left">
					<Button variant="secondary" className="navbar__menu" onClick={onMenu}>
						Menu
					</Button>
					<div className="navbar__brand">{tenant?.settings?.storeName || tenant?.name || 'POS System'}</div>
					<span className="muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{String(plan).toUpperCase()}</span>
				</div>
				<div className="navbar__right">
					{user ? (
						<span className="muted navbar__user">
							{user.name || user.email} ({user.role || 'user'})
						</span>
					) : null}
					<Button variant="secondary" onClick={() => dispatch(logout())}>
						Logout
					</Button>
				</div>
			</div>
		</div>
	)
}
