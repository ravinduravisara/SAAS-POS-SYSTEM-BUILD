export default function TopProducts({ items = [] }) {
	return (
		<div className="card">
			<h3 className="h3">Top Products</h3>
			{items.length === 0 ? (
				<div className="muted">No data yet.</div>
			) : (
				<div className="stack">
					{items.map((p) => (
						<div key={p.productId} className="row row--space">
							<span>{p.name}</span>
							<span className="muted">{p.quantity}</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
