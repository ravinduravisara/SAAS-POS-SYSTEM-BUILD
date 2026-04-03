import { useMemo } from 'react'
import Table from '../common/Table.jsx'
import Button from '../common/Button.jsx'

export default function CustomerTable({ customers = [], onEdit, onDelete }) {
	const columns = useMemo(
		() => [
			{ header: 'Name', key: 'name' },
			{ header: 'Phone', key: 'phone' },
			{ header: 'Email', key: 'email' },
			{
				header: 'Actions',
				key: 'actions',
				render: (row) => (
					<div className="row">
						<Button variant="secondary" onClick={() => onEdit?.(row)}>
							Edit
						</Button>
						<Button variant="secondary" onClick={() => onDelete?.(row)}>
							Delete
						</Button>
					</div>
				),
			},
		],
		[onEdit, onDelete],
	)

	return <Table columns={columns} rows={customers} />
}
