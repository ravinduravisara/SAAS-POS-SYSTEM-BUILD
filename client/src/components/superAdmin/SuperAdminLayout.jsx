import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../common/Button.jsx'
import Footer from '../layout/Footer.jsx'
import { logout } from '../../store/slices/authSlice'

const links = [
	{ to: '/super-admin', label: 'Platform Dashboard', icon: '📊', end: true },
	{ to: '/super-admin/tenants', label: 'Tenants Directory', icon: '🏢' },
	{ to: '/super-admin/subscriptions', label: 'Subscriptions & Plans', icon: '💳' },
]

function SuperAdminSidebarContent({ onNavigate = null }) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
			<div>
				<div
					style={{
						fontSize: '0.75rem',
						fontWeight: 700,
						color: '#64748b',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						padding: '8px 12px',
						marginBottom: '4px',
					}}
				>
					Platform Administration
				</div>
				<nav className="sidebar__nav">
					{links.map((link) => (
						<NavLink
							key={link.to}
							to={link.to}
							end={link.end}
							onClick={onNavigate}
							className={({ isActive }) =>
								`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
							}
						>
							<span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
							<span>{link.label}</span>
						</NavLink>
					))}
				</nav>
			</div>

			{/* SaaS Engine Status Pill at bottom of sidebar */}
			<div
				style={{
					marginTop: '24px',
					padding: '12px',
					background: '#f8fafc',
					border: '1px solid #e2e8f0',
					borderRadius: '8px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
					<span
						style={{
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							background: '#16a34a',
							display: 'inline-block',
						}}
					/>
					<span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
						Platform Online
					</span>
				</div>
				<div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>
					Universal Multi-Tenant Engine v2.0
				</div>
			</div>
		</div>
	)
}

export default function SuperAdminLayout() {
	const dispatch = useDispatch()
	const user = useSelector((state) => state.auth.user)
	const [drawerOpen, setDrawerOpen] = useState(false)

	// Lock body scroll when mobile drawer is open
	useEffect(() => {
		if (!drawerOpen) return
		const prev = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = prev
		}
	}, [drawerOpen])

	const userInitials = (user?.name || user?.email || 'SA')
		.slice(0, 2)
		.toUpperCase()

	return (
		<div className="app">
			{/* Top Header Navbar */}
			<header className="navbar">
				<div className="navbar__left">
					<Button
						variant="secondary"
						className="navbar__menu"
						onClick={() => setDrawerOpen((v) => !v)}
						aria-label="Open Super Admin Navigation"
						size="sm"
					>
						☰ Menu
					</Button>

					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						<div
							style={{
								width: '32px',
								height: '32px',
								borderRadius: '8px',
								background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
								color: '#ffffff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontWeight: 800,
								fontSize: '0.85rem',
								boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
							}}
						>
							SA
						</div>
						<div>
							<div className="navbar__brand" style={{ lineHeight: 1.1 }}>
								Super Admin
							</div>
							<div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
								PLATFORM CONTROL
							</div>
						</div>
					</div>

					<span
						style={{
							padding: '2px 8px',
							borderRadius: '9999px',
							fontSize: '0.7rem',
							fontWeight: 700,
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
							background: '#e0e7ff',
							color: '#4338ca',
						}}
					>
						Multi-Tenant
					</span>
				</div>

				<div className="navbar__right">
					{user && (
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<div
								style={{
									width: '32px',
									height: '32px',
									borderRadius: '50%',
									background: '#e0e7ff',
									color: '#4338ca',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '0.8rem',
									fontWeight: 700,
								}}
								title={user.email}
							>
								{userInitials}
							</div>
							<div className="navbar__user" style={{ textAlign: 'left', lineHeight: 1.2 }}>
								<div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
									{user.email || 'Super Administrator'}
								</div>
								<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
									Platform Super Admin
								</div>
							</div>
						</div>
					)}

					<Button
						variant="secondary"
						size="sm"
						onClick={() => dispatch(logout())}
						aria-label="Log out of Super Admin"
					>
						Logout
					</Button>
				</div>
			</header>

			{/* Layout Body with Sidebar and Main Content */}
			<div className="app__body">
				{/* Desktop Sidebar */}
				<aside className="sidebar">
					<SuperAdminSidebarContent />
				</aside>

				{/* Mobile & Tablet Drawer Panel */}
				<div className={`drawer ${drawerOpen ? 'drawer--open' : ''}`}>
					<div className="drawer__backdrop" onClick={() => setDrawerOpen(false)} />
					<div className="drawer__panel">
						<div className="sidebar sidebar--drawer" style={{ height: '100%', padding: '20px 16px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
								<div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
									Navigation
								</div>
								<Button size="sm" variant="secondary" onClick={() => setDrawerOpen(false)}>
									✕ Close
								</Button>
							</div>
							<SuperAdminSidebarContent onNavigate={() => setDrawerOpen(false)} />
						</div>
					</div>
				</div>

				{/* Main Content Viewport */}
				<main className="content">
					<Outlet />
				</main>
			</div>

			<Footer />
		</div>
	)
}
