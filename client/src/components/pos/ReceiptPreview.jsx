import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'

export default function ReceiptPreview({ open, receiptText, onClose }) {
	const handlePrint = () => {
		const printWindow = window.open('', '_blank', 'width=400,height=600')
		if (!printWindow) return
		printWindow.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Thermal Receipt</title>
				<style>
					body {
						font-family: 'Courier New', monospace;
						font-size: 13px;
						line-height: 1.4;
						padding: 20px;
						margin: 0;
						color: #000;
					}
					.center { text-align: center; }
					.right { text-align: right; }
					.divider { border-bottom: 1px dashed #000; margin: 8px 0; }
					table { width: 100%; border-collapse: collapse; }
					td { padding: 3px 0; }
					@media print {
						body { padding: 0; }
					}
				</style>
			</head>
			<body>
				<pre style="font-family: inherit; margin: 0; white-space: pre-wrap;">${receiptText || ''}</pre>
				<script>
					window.onload = function() {
						window.print();
						setTimeout(function() { window.close(); }, 500);
					};
				</script>
			</body>
			</html>
		`)
		printWindow.document.close()
	}

	return (
		<Modal
			title="Transaction Completed — Receipt"
			open={open}
			onClose={onClose}
			maxWidth="480px"
			footer={
				<div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
					<Button variant="secondary" onClick={handlePrint}>
						🖨️ Print Receipt
					</Button>
					<Button variant="primary" onClick={onClose}>
						✨ Start New Sale (Esc)
					</Button>
				</div>
			}
		>
			<div
				style={{
					background: '#f8fafc',
					border: '1px dashed #cbd5e1',
					borderRadius: '8px',
					padding: '20px',
					fontFamily: 'monospace',
					fontSize: '0.85rem',
					lineHeight: 1.5,
					color: '#1e293b',
					maxHeight: '380px',
					overflowY: 'auto',
				}}
			>
				<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{receiptText || 'Receipt unavailable'}</pre>
			</div>
		</Modal>
	)
}
