import { useEffect, useState } from 'react'
import InventoryTable from '../../components/inventory/InventoryTable.jsx'
import StockUpdateModal from '../../components/inventory/StockUpdateModal.jsx'
import inventoryService from '../../services/inventoryService'

export default function Inventory() {
	const [items, setItems] = useState([])
	const [error, setError] = useState(null)
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState(null)

	async function load() {
		try {
			setError(null)
			setItems(await inventoryService.list())
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load inventory')
		}
	}

	useEffect(() => {
		load()
	}, [])

	return (
		<div className="stack">
			<div className="muted">Track and update product stock.</div>
			{error ? <div className="card error">{error}</div> : null}
			<InventoryTable
				items={items}
				onUpdateStock={(product) => {
					setSelected(product)
					setOpen(true)
				}}
			/>
			<StockUpdateModal
				open={open}
				product={selected}
				onClose={() => {
					setOpen(false)
					setSelected(null)
				}}
				onSave={async ({ productId, stock }) => {
					await inventoryService.setStock(productId, stock)
					setOpen(false)
					setSelected(null)
					await load()
				}}
			/>
		</div>
	)
}
