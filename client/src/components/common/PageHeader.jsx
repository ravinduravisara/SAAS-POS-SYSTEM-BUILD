export default function PageHeader({
	title,
	subtitle = null,
	breadcrumbs = [],
	actions = null,
}) {
	return (
		<div style={{ marginBottom: '20px' }}>
			{breadcrumbs.length > 0 && (
				<nav
					aria-label="Breadcrumb"
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
						fontSize: '0.8125rem',
						color: 'var(--muted)',
						marginBottom: '6px',
					}}
				>
					{breadcrumbs.map((crumb, idx) => (
						<span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
							{crumb.href ? (
								<a href={crumb.href} style={{ color: 'var(--muted)' }}>
									{crumb.label}
								</a>
							) : (
								<span style={{ color: 'var(--text)', fontWeight: 500 }}>{crumb.label}</span>
							)}
							{idx < breadcrumbs.length - 1 && <span>/</span>}
						</span>
					))}
				</nav>
			)}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					flexWrap: 'wrap',
					gap: '12px',
				}}
			>
				<div>
					<h1 className="h1" style={{ margin: 0 }}>
						{title}
					</h1>
					{subtitle && (
						<p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
							{subtitle}
						</p>
					)}
				</div>
				{actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
			</div>
		</div>
	)
}
