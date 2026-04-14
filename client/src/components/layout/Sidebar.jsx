import { NavLink } from 'react-router-dom'
import { usePlan } from '../../hooks/usePlan'

const links = [
	{ to: '/dashboard', label: 'Home' },
	{ to: '/dashboard/pos', label: 'POS' },
	{ to: '/dashboard/products', label: 'Products' },
	{ to: '/dashboard/categories', label: 'Categories' },
	{ to: '/dashboard/inventory', label: 'Inventory', feature: 'inventoryManagement' },
	{ to: '/dashboard/customers', label: 'Customers' },
	{ to: '/dashboard/sales', label: 'Sales' },
	{ to: '/dashboard/purchases', label: 'Purchases', feature: 'purchaseManagement' },
	{ to: '/dashboard/expenses', label: 'Expenses', feature: 'expenseManagement' },
	{ to: '/dashboard/reports', label: 'Reports', feature: 'reports' },
	{ to: '/dashboard/users', label: 'Users' },
	{ to: '/dashboard/settings', label: 'Settings' },
]

export default function Sidebar() {
	return (
		<SidebarInner className="sidebar" />
	)
}

export function SidebarInner({ className = 'sidebar', onNavigate }) {
	const { can } = usePlan()
	const visibleLinks = links.filter((link) => !link.feature || can(link.feature))

	return (
		<aside className={className}>
			<nav className="sidebar__nav">
				{visibleLinks.map((l) => (
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
