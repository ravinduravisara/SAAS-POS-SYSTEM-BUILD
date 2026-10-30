export default function StatusBadge({ status, className = '' }) {
	const normalized = String(status || '').toLowerCase().trim()

	let variant = 'neutral'
	if (['active', 'completed', 'paid', 'available', 'present', 'delivered'].includes(normalized)) {
		variant = 'success'
	} else if (['trial', 'pending', 'preparing', 'under_inspection', 'in_progress', 'draft', 'reserved'].includes(normalized)) {
		variant = 'warning'
	} else if (['suspended', 'cancelled', 'expired', 'failed', 'absent', 'occupied'].includes(normalized)) {
		variant = 'danger'
	} else if (['past_due', 'refunded', 'ready', 'placed', 'received'].includes(normalized)) {
		variant = 'info'
	}

	return (
		<span className={`badge badge--${variant} ${className}`.trim()}>
			<span
				style={{
					width: '6px',
					height: '6px',
					borderRadius: '50%',
					backgroundColor: 'currentColor',
				}}
			/>
			{normalized.replace('_', ' ')}
		</span>
	)
}

