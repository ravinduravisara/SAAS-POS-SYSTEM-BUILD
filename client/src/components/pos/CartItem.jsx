import { formatCurrency } from '../../utils/formatCurrency'

export default function CartItem({ item, onRemove, onQty }) {
	const lineTotal = Number(item.price || 0) * Number(item.quantity || 1)

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: '10px 0',
				borderBottom: '1px solid var(--border)',
				gap: '10px',
			}}
		>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontWeight: 600,
						fontSize: '0.875rem',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{item.name}
				</div>
				<div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
					{formatCurrency(item.price)} each
				</div>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
				<button
					type="button"
					onClick={() => onQty?.(Math.max(1, (item.quantity || 1) - 1))}
					style={{
						width: '24px',
						height: '24px',
						borderRadius: '4px',
						border: '1px solid var(--border-strong)',
						background: '#ffffff',
						cursor: 'pointer',
						fontSize: '0.875rem',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					-
				</button>
				<span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: '20px', textAlign: 'center' }}>
					{item.quantity}
				</span>
				<button
					type="button"
					onClick={() => onQty?.((item.quantity || 1) + 1)}
					style={{
						width: '24px',
						height: '24px',
						borderRadius: '4px',
						border: '1px solid var(--border-strong)',
						background: '#ffffff',
						cursor: 'pointer',
						fontSize: '0.875rem',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					+
				</button>
			</div>

			<div style={{ textAlign: 'right', minWidth: '70px' }}>
				<div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
					{formatCurrency(lineTotal)}
				</div>
				<button
					type="button"
					onClick={onRemove}
					style={{
						background: 'none',
						border: 'none',
						color: 'var(--danger)',
						fontSize: '0.75rem',
						cursor: 'pointer',
						padding: 0,
					}}
				>
					Remove
				</button>
			</div>
		</div>
	)
}
