export default function Input({ label, ...props }) {
	return (
		<label className="field">
			{label ? <span className="field__label">{label}</span> : null}
			<input className="input" {...props} />
		</label>
	)
}
