import { useState } from 'react'
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
	const [now] = useState(() => Date.now())

	const trialDays =
		trialEndsAt && now > 0
			? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
			: null

	const planBadgeColor =
		plan === 'enterprise'
			? { bg: '#ede9fe', color: '#6d28d9' }
			: plan === 'pro'
			? { bg: '#e0f2fe', color: '#0369a1' }
			: { bg: '#f1f5f9', color: '#475569' }

	const userInitials = (user?.name || user?.email || 'U')
		.slice(0, 2)
		.toUpperCase()

	return (
		<div>
			{trialDays !== null && trialDays > 0 && subscription?.status === 'trial' ? (
				<div
					style={{
						background: '#fffbeb',
						borderBottom: '1px solid #fde68a',
						padding: '8px 20px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						fontSize: '0.8125rem',
						color: '#92400e',
					}}
				>
					<span>
						⚠️ <strong>Trial Mode:</strong> Your trial expires in {trialDays} day
						{trialDays === 1 ? '' : 's'}. Contact platform admin to upgrade.
					</span>
					<span style={{ fontWeight: 600 }}>Active Workspace</span>
				</div>
			) : null}

			<header className="navbar">
				<div className="navbar__left">
					<Button
						variant="secondary"
						className="navbar__menu"
						onClick={onMenu}
						aria-label="Open navigation menu"
						size="sm"
					>
						☰ Menu
					</Button>

					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<div
							style={{
								width: '28px',
								height: '28px',
								borderRadius: '6px',
								background: 'var(--primary)',
								color: '#ffffff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontWeight: 800,
								fontSize: '0.875rem',
							}}
						>
							P
						</div>
						<div className="navbar__brand">
							{tenant?.settings?.storeName || tenant?.name || 'SaaS POS'}
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
							background: planBadgeColor.bg,
							color: planBadgeColor.color,
						}}
					>
						{plan}
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
									background: 'var(--border-strong)',
									color: 'var(--text)',
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
								<div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name || 'User'}</div>
								<div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
									{user.role || 'Staff'}
								</div>
							</div>
						</div>
					)}

					<Button
						variant="secondary"
						size="sm"
						onClick={() => dispatch(logout())}
						aria-label="Log out of application"
					>
						Log out
					</Button>
				</div>
			</header>
		</div>
	)
}
