export default function Table({ columns = [], rows = [] }) {
	return (
		<div className="table">
			<table>
				<thead>
					<tr>
						{columns.map((c) => (
							<th key={c.key || c.header}>{c.header}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, idx) => (
						<tr key={row.id || idx}>
							{columns.map((c) => (
								<td key={c.key || c.header}>
									{typeof c.render === 'function' ? c.render(row) : row[c.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
