import { useMemo } from 'react'
import Table from '../common/Table.jsx'
import Button from '../common/Button.jsx'
import { formatCurrency } from '../../utils/formatCurrency'

export default function InventoryTable({ items = [], onUpdateStock }) {
	const columns = useMemo(
		() => [
			{ header: 'Product', key: 'name' },
			{ header: 'Price', key: 'price', render: (row) => formatCurrency(row.price ?? 0) },
			{ header: 'Stock', key: 'stock' },
			{
				header: 'Actions',
				key: 'actions',
				render: (row) => (
					<Button variant="secondary" onClick={() => onUpdateStock?.(row)}>
						Update Stock
					</Button>
				),
			},
		],
		[onUpdateStock],
	)

	return <Table columns={columns} rows={items} />
}
