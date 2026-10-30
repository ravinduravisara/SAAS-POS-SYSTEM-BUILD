import { NavLink } from 'react-router-dom'
import { usePlan } from '../../hooks/usePlan'

const links = [
	{ to: '/dashboard', label: 'Home' },
	{ to: '/dashboard/pos', label: 'POS Terminal', feature: 'pos.core' },
	{ to: '/dashboard/sales', label: 'Sales & Invoices', feature: 'sales.history' },
	{ to: '/dashboard/products', label: 'Products' },
	{ to: '/dashboard/categories', label: 'Categories' },
	{ to: '/dashboard/inventory', label: 'Inventory', feature: 'inventory.core' },
	{ to: '/dashboard/customers', label: 'Customers' },
	{ to: '/dashboard/purchases', label: 'Purchases (GRN)', feature: 'purchases.core' },
	{ to: '/dashboard/expenses', label: 'Expenses', feature: 'finance.expenses' },
	{ to: '/dashboard/reports', label: 'Reports', feature: 'reports.advanced' },
	{ to: '/dashboard/restaurant', label: 'Restaurant & KDS', feature: 'restaurant.core' },
	{ to: '/dashboard/repairs', label: 'Service Center & Repairs', feature: 'repairs.jobCards' },
	{ to: '/dashboard/salon', label: 'Salon & Bookings', feature: 'salon.appointments' },
	{ to: '/dashboard/hrm', label: 'HRM & Payroll', feature: 'hrm.core' },
	{ to: '/dashboard/users', label: 'Employees' },
	{ to: '/dashboard/settings', label: 'Settings' },
]

export default function Sidebar() {
	return <SidebarInner className="sidebar" />
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
