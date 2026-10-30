export default function LoadingSkeleton({
	type = 'table', // 'table' | 'card' | 'line'
	count = 5,
	height = '40px',
}) {
	if (type === 'card') {
		return (
			<div className="grid grid--3">
				{Array.from({ length: count }).map((_, idx) => (
					<div
						key={idx}
						className="skeleton"
						style={{ height: '110px', borderRadius: '12px' }}
					/>
				))}
			</div>
		)
	}

	if (type === 'line') {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{Array.from({ length: count }).map((_, idx) => (
					<div
						key={idx}
						className="skeleton"
						style={{ height, width: '100%', borderRadius: '6px' }}
					/>
				))}
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
			<div
				className="skeleton"
				style={{ height: '44px', width: '100%', borderRadius: '8px 8px 0 0' }}
			/>
			{Array.from({ length: count }).map((_, idx) => (
				<div
					key={idx}
					className="skeleton"
					style={{ height, width: '100%', borderRadius: '4px' }}
				/>
			))}
		</div>
	)
}

