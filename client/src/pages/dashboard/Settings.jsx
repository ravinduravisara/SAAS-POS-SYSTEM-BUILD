import { useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import settingsService from '../../services/settingsService'

export default function Settings() {
	const [currency, setCurrency] = useState('LKR')
	const [taxRate, setTaxRate] = useState(0)
	const [status, setStatus] = useState('idle')
	const [error, setError] = useState(null)

	useEffect(() => {
		settingsService
			.get()
			.then((s) => {
				setCurrency(s.currency || 'LKR')
				setTaxRate(Number(s.taxRate || 0))
			})
			.catch(() => {})
	}, [])

	async function save() {
		setStatus('saving')
		setError(null)
		try {
			await settingsService.update({ currency, taxRate: Number(taxRate || 0) })
			setStatus('saved')
			setTimeout(() => setStatus('idle'), 800)
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to save')
			setStatus('idle')
		}
	}

	return (
		<div className="card stack">
			<div className="muted">Basic store settings.</div>
			<Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
			<Input
				label="Tax Rate (0.15 = 15%)"
				type="number"
				step="0.01"
				value={taxRate}
				onChange={(e) => setTaxRate(e.target.value)}
			/>
			{error ? <div className="error">{error}</div> : null}
			<Button onClick={save} disabled={status === 'saving'}>
				{status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Save'}
			</Button>
		</div>
	)
}
