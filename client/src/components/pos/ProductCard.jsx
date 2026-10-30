import { formatCurrency } from '../../utils/formatCurrency'

export default function ProductCard({ product, onAdd }) {
	const stock = Number(product.stock || 0)
	const isOutOfStock = stock <= 0
	const isLowStock = stock > 0 && stock <= 5

	return (
		<div
			className="card"
			onClick={() => !isOutOfStock && onAdd()}
			tabIndex={isOutOfStock ? -1 : 0}
			onKeyDown={(e) => {
				if ((e.key === 'Enter' || e.key === ' ') && !isOutOfStock) {
					e.preventDefault()
					onAdd()
				}
			}}
			style={{
				cursor: isOutOfStock ? 'not-allowed' : 'pointer',
				opacity: isOutOfStock ? 0.6 : 1,
				padding: '14px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				position: 'relative',
				transition: 'all 140ms ease',
			}}
		>
			<div>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
					<span
						style={{
							fontSize: '0.7rem',
							fontFamily: 'monospace',
							background: '#f1f5f9',
							color: '#475569',
							padding: '2px 6px',
							borderRadius: '4px',
						}}
					>
						{product.sku || 'SKU'}
					</span>
					<span
						style={{
							fontSize: '0.7rem',
							fontWeight: 700,
							color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)',
							background: isOutOfStock
								? 'var(--danger-light)'
								: isLowStock
								? 'var(--warning-light)'
								: 'var(--success-light)',
							padding: '2px 6px',
							borderRadius: '4px',
						}}
					>
						{isOutOfStock ? 'Out of stock' : `${stock} in stock`}
					</span>
				</div>

				<h4
					style={{
						margin: '8px 0 4px',
						fontSize: '0.95rem',
						fontWeight: 600,
						color: 'var(--text)',
						lineHeight: 1.3,
					}}
				>
					{product.name}
				</h4>
			</div>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginTop: '10px',
					paddingTop: '8px',
					borderTop: '1px solid var(--border)',
				}}
			>
				<span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
					{formatCurrency(product.price)}
				</span>
				<button
					type="button"
					disabled={isOutOfStock}
					onClick={(e) => {
						e.stopPropagation()
						if (!isOutOfStock) onAdd()
					}}
					className="btn btn--primary btn--sm"
					style={{ padding: '4px 10px', fontSize: '0.8rem' }}
				>
					+ Add
				</button>
			</div>
		</div>
	)
}
