export default function Button({
	children,
	variant = 'primary',
	size = 'md',
	type = 'button',
	onClick,
	disabled = false,
	loading = false,
	className = '',
	icon = null,
	...rest
}) {
	const sizeClass = size === 'sm' ? 'btn--sm' : size === 'lg' ? 'btn--lg' : ''

	return (
		<button
			type={type}
			className={`btn btn--${variant} ${sizeClass} ${className}`.trim()}
			onClick={onClick}
			disabled={disabled || loading}
			aria-busy={loading}
			{...rest}
		>
			{loading ? (
				<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
					<svg
						style={{ animation: 'spin 1s linear infinite', width: '14px', height: '14px' }}
						viewBox="0 0 24 24"
						fill="none"
					>
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
							strokeDasharray="30 60"
						/>
					</svg>
					<span>Loading...</span>
				</span>
			) : (
				<>
					{icon && <span className="btn__icon">{icon}</span>}
					{children}
				</>
			)}
		</button>
	)
}
