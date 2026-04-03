import { NavLink } from 'react-router-dom'

const links = [
	{ to: '/dashboard', label: 'Home' },
	{ to: '/dashboard/pos', label: 'POS' },
	{ to: '/dashboard/products', label: 'Products' },
	{ to: '/dashboard/categories', label: 'Categories' },
	{ to: '/dashboard/inventory', label: 'Inventory' },
	{ to: '/dashboard/customers', label: 'Customers' },
	{ to: '/dashboard/sales', label: 'Sales' },
	{ to: '/dashboard/purchases', label: 'Purchases' },
	{ to: '/dashboard/expenses', label: 'Expenses' },
	{ to: '/dashboard/reports', label: 'Reports' },
	{ to: '/dashboard/users', label: 'Users' },
	{ to: '/dashboard/settings', label: 'Settings' },
]

export default function Sidebar() {
	return (
		<SidebarInner className="sidebar" />
	)
}

export function SidebarInner({ className = 'sidebar', onNavigate }) {
	return (
		<aside className={className}>
			<nav className="sidebar__nav">
				{links.map((l) => (
					<NavLink
						key={l.to}
						to={l.to}
						end={l.to === '/dashboard'}
						onClick={() => onNavigate?.()}
						className={({ isActive }) =>
							`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
						}
					>
						{l.label}
					</NavLink>
				))}
			</nav>
		</aside>
	)
}
