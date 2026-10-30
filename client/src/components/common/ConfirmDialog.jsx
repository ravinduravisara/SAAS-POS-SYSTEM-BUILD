import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function ConfirmDialog({
	open,
	title = 'Confirm Action',
	message = 'Are you sure you want to proceed? This action may be irreversible.',
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'danger',
	onConfirm,
	onCancel,
	loading = false,
}) {
	return (
		<Modal
			open={open}
			onClose={onCancel}
			title={title}
			maxWidth="440px"
			footer={
				<>
					<Button variant="secondary" onClick={onCancel} disabled={loading}>
						{cancelText}
					</Button>
					<Button variant={variant} onClick={onConfirm} loading={loading}>
						{confirmText}
					</Button>
				</>
			}
		>
			<p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
				{message}
			</p>
		</Modal>
	)
}
