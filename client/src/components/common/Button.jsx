export default function Button({
	children,
	variant = 'primary',
	type = 'button',
	onClick,
	disabled,
	className = '',
	...rest
}) {
	return (
		<button
			type={type}
			className={`btn btn--${variant} ${className}`.trim()}
			onClick={onClick}
			disabled={disabled}
			{...rest}
		>
			{children}
		</button>
	)
}
