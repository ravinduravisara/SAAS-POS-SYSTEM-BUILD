import { useEffect } from 'react'

export default function Modal({
	title,
	open,
	onClose,
	children,
	maxWidth = '600px',
	footer = null,
}) {
	useEffect(() => {
		if (!open) return
		const handleKeyDown = (e) => {
			if (e.key === 'Escape') {
				onClose?.()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [open, onClose])

	if (!open) return null

	return (
		<div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<div className="modal__backdrop" onClick={onClose} />
			<div className="modal__panel" style={{ maxWidth }}>
				<div className="modal__header">
					<h3 id="modal-title" className="h3" style={{ margin: 0, fontWeight: 700 }}>
						{title}
					</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close dialog"
						style={{
							background: 'none',
							border: 'none',
							fontSize: '1.25rem',
							lineHeight: 1,
							color: '#64748b',
							cursor: 'pointer',
							padding: '4px 8px',
							borderRadius: '4px',
						}}
					>
						✕
					</button>
				</div>
				<div className="modal__body">{children}</div>
				{footer && <div className="modal__footer">{footer}</div>}
			</div>
		</div>
	)
}
