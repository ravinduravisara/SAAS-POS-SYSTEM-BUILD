import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import settingsService from '../../services/settingsService'

export default function Settings() {
	const tenant = useSelector((state) => state.auth.tenant)
	const subscription = useSelector((state) => state.auth.subscription)
	const planFeatures = useSelector((state) => state.auth.planFeatures)
	const [currency, setCurrency] = useState('LKR')
	const [taxRate, setTaxRate] = useState(0)
	const [status, setStatus] = useState('idle')
	const [error, setError] = useState(null)
	const [successMsg, setSuccessMsg] = useState(null)

	useEffect(() => {
		settingsService
			.get()
			.then((s) => {
				setCurrency(s.currency || 'LKR')
				setTaxRate(Number(s.taxRate || 0))
			})
			.catch(() => {})
	}, [])

	async function save(e) {
		e?.preventDefault()
		setStatus('saving')
		setError(null)
		setSuccessMsg(null)
		try {
			await settingsService.update({ currency, taxRate: Number(taxRate || 0) })
			setStatus('saved')
			setSuccessMsg('Settings successfully updated.')
			setTimeout(() => {
				setStatus('idle')
				setSuccessMsg(null)
			}, 2500)
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to save settings')
			setStatus('idle')
		}
	}

	return (
		<div className="stack">
			<PageHeader
				title="Store & System Settings"
				subtitle="Configure store currency, default sales tax rates, and review active plan entitlements."
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
					{successMsg}
				</div>
			)}

			<div className="grid grid--2">
				{/* Store Configuration Form */}
				<div className="card" style={{ padding: '1.5rem' }}>
					<h3 className="h3" style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>
						Store Financial Configuration
					</h3>
					<form className="stack" onSubmit={save} style={{ gap: '1rem' }}>
						<div>
							<label className="label">Store Default Currency</label>
							<select
								className="input"
								value={currency}
								onChange={(e) => setCurrency(e.target.value)}
							>
								<option value="LKR">LKR — Sri Lankan Rupee (Rs.)</option>
								<option value="USD">USD — US Dollar ($)</option>
								<option value="EUR">EUR — Euro (€)</option>
								<option value="GBP">GBP — British Pound (£)</option>
								<option value="AUD">AUD — Australian Dollar (A$)</option>
								<option value="CAD">CAD — Canadian Dollar (C$)</option>
								<option value="SGD">SGD — Singapore Dollar (S$)</option>
								<option value="AED">AED — UAE Dirham (د.إ)</option>
								<option value="INR">INR — Indian Rupee (₹)</option>
							</select>
							<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
								Currency applied to POS receipts, catalog pricing, and reporting.
							</div>
						</div>

						<div>
							<Input
								label="Default Sales Tax Rate"
								type="number"
								step="0.001"
								min="0"
								max="1"
								value={taxRate}
								onChange={(e) => setTaxRate(e.target.value)}
								placeholder="e.g. 0.08 for 8%"
							/>
							<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
								Enter as a decimal (e.g. <strong>0.15</strong> represents <strong>15% VAT / Sales Tax</strong>).
								Current active rate: <strong>{(Number(taxRate || 0) * 100).toFixed(1)}%</strong>
							</div>
						</div>

						<div style={{ paddingTop: '0.5rem' }}>
							<Button type="submit" disabled={status === 'saving'}>
								{status === 'saving' ? 'Saving Settings...' : 'Save Configuration'}
							</Button>
						</div>
					</form>
				</div>

				{/* Subscription & Entitlements Card */}
				<div className="card" style={{ padding: '1.5rem' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
						<h3 className="h3" style={{ margin: 0, color: '#0f172a' }}>
							Subscription & Entitlements
						</h3>
						<StatusBadge
							status={tenant?.status === 'active' ? 'success' : 'warning'}
							label={tenant?.status || 'Active'}
						/>
					</div>

					<div className="stack" style={{ gap: '0.75rem', fontSize: '0.875rem' }}>
						<div className="row row--space" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
							<span style={{ color: '#64748b' }}>Store Name:</span>
							<strong style={{ color: '#0f172a' }}>{tenant?.name || 'My Store'}</strong>
						</div>
						<div className="row row--space" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
							<span style={{ color: '#64748b' }}>Subscription Tier:</span>
							<span
								style={{
									fontWeight: 700,
									textTransform: 'uppercase',
									color: '#4f46e5',
									backgroundColor: '#eef2ff',
									padding: '2px 8px',
									borderRadius: '4px',
									fontSize: '0.75rem',
								}}
							>
								{tenant?.plan || 'starter'}
							</span>
						</div>
						<div className="row row--space" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
							<span style={{ color: '#64748b' }}>Renewal / Expiry:</span>
							<strong style={{ color: '#0f172a' }}>
								{subscription?.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : 'Active Commercial'}
							</strong>
						</div>

						<div style={{ marginTop: '0.75rem' }}>
							<div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
								Enabled Feature Flags:
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
								{Object.entries(planFeatures || {}).map(([featureKey, val]) => {
									const isEnabled = typeof val === 'boolean' ? val : Boolean(val)
									return (
										<span
											key={featureKey}
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: '4px',
												padding: '3px 8px',
												borderRadius: '4px',
												fontSize: '0.75rem',
												fontWeight: 500,
												backgroundColor: isEnabled ? '#f0fdf4' : '#f8fafc',
												color: isEnabled ? '#15803d' : '#94a3b8',
												border: `1px solid ${isEnabled ? '#bbf7d0' : '#e2e8f0'}`,
											}}
										>
											{isEnabled ? '✓' : '🔒'} {featureKey}
										</span>
									)
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
