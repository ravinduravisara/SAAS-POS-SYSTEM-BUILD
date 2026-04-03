import Modal from '../common/Modal.jsx'

export default function ReceiptPreview({ open, receiptText, onClose }) {
	return (
		<Modal title="Receipt" open={open} onClose={onClose}>
			<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{receiptText || ''}</pre>
		</Modal>
	)
}
