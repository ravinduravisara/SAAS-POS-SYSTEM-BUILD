export default function EmptyState({
	title = 'No records found',
	description = 'There are no items matching your criteria or no data has been created yet.',
	actionText = null,
	onAction = null,
	icon = '📋',
}) {
	return (
		<div className="empty-state">
			<div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{icon}</div>
			<div className="empty-state__title">{title}</div>
			<div className="empty-state__desc">{description}</div>
			{actionText && onAction && (
				<button type="button" className="btn btn--primary" onClick={onAction}>
					{actionText}
				</button>
			)}
		</div>
	)
}

