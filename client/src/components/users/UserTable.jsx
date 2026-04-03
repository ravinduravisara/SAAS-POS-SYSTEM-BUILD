import { useMemo } from 'react'
import Table from '../common/Table.jsx'
import Button from '../common/Button.jsx'

export default function UserTable({ users = [], onEdit, onDelete }) {
	const columns = useMemo(
		() => [
			{ header: 'Name', key: 'name' },
			{ header: 'Email', key: 'email' },
			{ header: 'Role', key: 'role' },
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

	return <Table columns={columns} rows={users} />
}
