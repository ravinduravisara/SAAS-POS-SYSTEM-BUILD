import { NavLink } from 'react-router-dom'
import { usePlan } from '../../hooks/usePlan'

const moduleSections = [
	{
		title: 'Operations',
		links: [
			{ to: '/dashboard', label: 'Dashboard', icon: '📊' },
			{ to: '/dashboard/pos', label: 'POS Terminal', feature: 'pos.core', icon: '💳' },
			{ to: '/dashboard/sales', label: 'Sales & Invoices', feature: 'sales.history', icon: '🧾' },
		],
	},
	{
		title: 'Inventory & Stock',
		links: [
			{ to: '/dashboard/products', label: 'Products', icon: '📦' },
			{ to: '/dashboard/categories', label: 'Categories', icon: '🏷️' },
			{ to: '/dashboard/inventory', label: 'Stock Balances', feature: 'inventory.core', icon: '📈' },
			{ to: '/dashboard/purchases', label: 'Purchases (GRN)', feature: 'purchases.core', icon: '📥' },
		],
	},
	{
		title: 'Finance & CRM',
		links: [
			{ to: '/dashboard/customers', label: 'Customers', icon: '👥' },
			{ to: '/dashboard/expenses', label: 'Expenses', feature: 'finance.expenses', icon: '💸' },
			{ to: '/dashboard/reports', label: 'Analytics & Reports', feature: 'reports.advanced', icon: '📊' },
		],
	},
	{
		title: 'Industry Modules',
		links: [
			{ to: '/dashboard/restaurant', label: 'Restaurant & KDS', feature: 'restaurant.core', icon: '🍽️' },
			{ to: '/dashboard/repairs', label: 'Repairs & Job Cards', feature: 'repairs.jobCards', icon: '🔧' },
			{ to: '/dashboard/salon', label: 'Salon & Bookings', feature: 'salon.appointments', icon: '✂️' },
			{ to: '/dashboard/hrm', label: 'HRM & Payroll', feature: 'hrm.core', icon: '💼' },
		],
	},
	{
		title: 'Administration',
		links: [
			{ to: '/dashboard/users', label: 'Staff Directory', icon: '👤' },
			{ to: '/dashboard/settings', label: 'Store Settings', icon: '⚙️' },
		],
	},
]

export default function Sidebar() {
	return <SidebarInner className="sidebar" />
}

export function SidebarInner({ className = 'sidebar', onNavigate }) {
	const { can } = usePlan()

	return (
		<aside className={className}>
			<nav className="sidebar__nav">
				{moduleSections.map((section, sIdx) => {
					const visibleSectionLinks = section.links.filter((l) => !l.feature || can(l.feature))
					if (visibleSectionLinks.length === 0) return null

					return (
						<div key={sIdx} style={{ marginBottom: '14px' }}>
							<div
								style={{
									fontSize: '0.6875rem',
									fontWeight: 700,
									textTransform: 'uppercase',
									letterSpacing: '0.6px',
									color: '#94a3b8',
									padding: '0 12px 6px',
								}}
							>
								{section.title}
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
								{visibleSectionLinks.map((l) => (
									<NavLink
										key={l.to}
										to={l.to}
										end={l.to === '/dashboard'}
										onClick={() => onNavigate?.()}
										className={({ isActive }) =>
											`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
										}
									>
										<span style={{ fontSize: '1rem', lineHeight: 1 }}>{l.icon}</span>
										<span>{l.label}</span>
									</NavLink>
								))}
							</div>
						</div>
					)
				})}
			</nav>

			<div
				style={{
					padding: '12px',
					borderRadius: '8px',
					background: '#f8fafc',
					border: '1px solid #e2e8f0',
					marginTop: '16px',
					fontSize: '0.75rem',
					color: '#64748b',
					textAlign: 'center',
				}}
			>
				<div>Universal SaaS POS v2.0</div>
				<div style={{ fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>
					Commercial Edition
				</div>
			</div>
		</aside>
	)
}
