import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../common/Button.jsx'
import { logout } from '../../store/slices/authSlice'

const links = [
	{ to: '/super-admin', label: 'Dashboard', end: true },
	{ to: '/super-admin/tenants', label: 'Tenants' },
	{ to: '/super-admin/subscriptions', label: 'Subscriptions' },
]

export default function SuperAdminLayout() {
	const dispatch = useDispatch()
	const user = useSelector((state) => state.auth.user)

	return (
		<div className="app">
			<div className="navbar">
				<div className="navbar__left">
					<div className="navbar__brand">Super Admin</div>
					<span className="muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Platform</span>
				</div>
				<div className="navbar__right">
					{user ? <span className="muted">{user.email}</span> : null}
					<Button variant="secondary" onClick={() => dispatch(logout())}>Logout</Button>
				</div>
			</div>
			<div className="app__body">
				<aside className="sidebar">
					<nav className="sidebar__nav">
						{links.map((link) => (
							<NavLink
								key={link.to}
								to={link.to}
								end={link.end}
								className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
							>
								{link.label}
							</NavLink>
						))}
					</nav>
				</aside>
				<main className="content">
					<Outlet />
				</main>
			</div>
		</div>
	)
}