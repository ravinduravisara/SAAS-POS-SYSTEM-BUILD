export default function SearchInput({
	value,
	onChange,
	placeholder = 'Search...',
	onClear = null,
	className = '',
	style = {},
}) {
	return (
		<div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%', maxWidth: '320px', ...style }}>
			<span
				style={{
					position: 'absolute',
					left: '10px',
					color: 'var(--muted)',
					fontSize: '0.875rem',
					pointerEvents: 'none',
				}}
			>
				🔍
			</span>
			<input
				type="text"
				className={`input ${className}`.trim()}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				style={{ paddingLeft: '32px', paddingRight: value ? '28px' : '12px' }}
			/>
			{value && (
				<button
					type="button"
					onClick={() => {
						onChange('')
						onClear?.()
					}}
					aria-label="Clear search input"
					style={{
						position: 'absolute',
						right: '8px',
						background: 'none',
						border: 'none',
						color: 'var(--muted)',
						cursor: 'pointer',
						padding: '2px 4px',
						fontSize: '0.85rem',
					}}
				>
					✕
				</button>
			)}
		</div>
	)
}
