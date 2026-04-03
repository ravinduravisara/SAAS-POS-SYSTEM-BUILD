import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './Navbar.jsx'
import Sidebar, { SidebarInner } from './Sidebar.jsx'
import Footer from './Footer.jsx'

function titleFromPath(pathname) {
	const parts = pathname.split('/').filter(Boolean)
	const last = parts[parts.length - 1] || 'dashboard'
	return last
		.replace(/[-_]/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function DashboardLayout() {
	const location = useLocation()
	const title = titleFromPath(location.pathname)
	const [drawerOpen, setDrawerOpen] = useState(false)

	useEffect(() => {
		if (!drawerOpen) return
		const prev = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = prev
		}
	}, [drawerOpen])

	return (
		<div className="app">
			<Navbar onMenu={() => setDrawerOpen((v) => !v)} />
			<div className="app__body">
				<Sidebar />

				<div className={`drawer ${drawerOpen ? 'drawer--open' : ''}`}>
					<div className="drawer__backdrop" onClick={() => setDrawerOpen(false)} />
					<div className="drawer__panel">
						<SidebarInner
							className="sidebar sidebar--drawer"
							onNavigate={() => setDrawerOpen(false)}
						/>
					</div>
				</div>

				<main className="content">
					<div className="content__header">
						<h2 className="h2">{title}</h2>
					</div>
					<Outlet />
				</main>
			</div>
			<Footer />
		</div>
	)
}
