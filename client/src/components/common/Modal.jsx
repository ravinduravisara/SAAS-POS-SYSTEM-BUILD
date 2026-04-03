import Button from './Button.jsx'

export default function Modal({ title, open, onClose, children }) {
	if (!open) return null

	return (
		<div className="modal" role="dialog" aria-modal="true">
			<div className="modal__backdrop" onClick={onClose} />
			<div className="modal__panel">
				<div className="modal__header">
					<h3 className="h3">{title}</h3>
					<Button variant="secondary" onClick={onClose}>
						Close
					</Button>
				</div>
				<div className="modal__body">{children}</div>
			</div>
		</div>
	)
}
