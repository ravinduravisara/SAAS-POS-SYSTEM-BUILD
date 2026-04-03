import Button from './Button.jsx'

export default function Pagination({ page = 1, totalPages = 1, onChange }) {
	return (
		<div className="pagination">
			<Button
				variant="secondary"
				disabled={page <= 1}
				onClick={() => onChange?.(page - 1)}
			>
				Prev
			</Button>
			<span className="pagination__info">
				Page {page} / {totalPages}
			</span>
			<Button
				variant="secondary"
				disabled={page >= totalPages}
				onClick={() => onChange?.(page + 1)}
			>
				Next
			</Button>
		</div>
	)
}
