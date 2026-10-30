export default function StatCard({
	title,
	value,
	sub = null,
	icon = null,
	trend = null, // { value: '+12%', isPositive: true }
	className = '',
}) {
	return (
		<div className={`stat-card ${className}`.trim()}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
				<div className="stat-card__title">{title}</div>
				{icon && (
					<div
						style={{
							padding: '8px',
							borderRadius: '8px',
							background: 'var(--primary-light)',
							color: 'var(--primary)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{icon}
					</div>
				)}
			</div>
			<div className="stat-card__value">{value}</div>
			{(sub || trend) && (
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					{trend && (
						<span
							style={{
								fontSize: '0.75rem',
								fontWeight: 700,
								color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
								background: trend.isPositive ? 'var(--success-light)' : 'var(--danger-light)',
								padding: '2px 6px',
								borderRadius: '4px',
							}}
						>
							{trend.value}
						</span>
					)}
					{sub && <span className="stat-card__sub">{sub}</span>}
				</div>
			)}
		</div>
	)
}

