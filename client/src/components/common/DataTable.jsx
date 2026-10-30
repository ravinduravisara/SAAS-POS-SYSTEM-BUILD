import SearchInput from './SearchInput.jsx'
import LoadingSkeleton from './LoadingSkeleton.jsx'
import EmptyState from './EmptyState.jsx'
import Pagination from './Pagination.jsx'

export default function DataTable({
	columns = [],
	data = [],
	loading = false,
	searchQuery = null,
	onSearchChange = null,
	searchPlaceholder = 'Search records...',
	actions = null,
	emptyTitle = 'No data available',
	emptyDescription = 'No records match the current view.',
	emptyActionText = null,
	onEmptyAction = null,
	page = 1,
	pageSize = 10,
	total = null,
	onPageChange = null,
	keyExtractor = (item, idx) => item?.id || idx,
}) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
			{(onSearchChange || actions) && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '12px',
					}}
				>
					{onSearchChange ? (
						<SearchInput
							value={searchQuery || ''}
							onChange={onSearchChange}
							placeholder={searchPlaceholder}
						/>
					) : (
						<div />
					)}
					{actions && <div>{actions}</div>}
				</div>
			)}

			{loading ? (
				<LoadingSkeleton type="table" count={pageSize > 5 ? 5 : pageSize} />
			) : data.length === 0 ? (
				<EmptyState
					title={emptyTitle}
					description={emptyDescription}
					actionText={emptyActionText}
					onAction={onEmptyAction}
				/>
			) : (
				<div className="table">
					<table>
						<thead>
							<tr>
								{columns.map((col, idx) => (
									<th key={col.key || idx} style={col.width ? { width: col.width } : {}}>
										{col.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.map((row, rowIdx) => (
								<tr key={keyExtractor(row, rowIdx)}>
									{columns.map((col, colIdx) => (
										<td key={col.key || colIdx}>
											{col.render ? col.render(row) : row[col.key]}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{total !== null && onPageChange && total > pageSize && (
				<Pagination
					page={page}
					pageSize={pageSize}
					total={total}
					onPageChange={onPageChange}
				/>
			)}
		</div>
	)
}

