import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Table from '../../components/common/Table.jsx'
import superAdminService from '../../services/superAdminService'

export default function TenantDetail() {
	const { id } = useParams()
	const [tenant, setTenant] = useState(null)

	useEffect(() => {
		superAdminService.getTenant(id).then(setTenant).catch(() => setTenant(null))
	}, [id])

	if (!tenant) {
		return <div className="card">Loading tenant...</div>
	}

	return (
		<div className="stack">
			<div className="card stack">
				<h3 className="h3">{tenant.name}</h3>
				<div>Email: {tenant.email}</div>
				<div>Plan: {tenant.plan}</div>
				<div>Status: {tenant.status}</div>
				<div>Created: {tenant.createdAt}</div>
			</div>
			<div className="grid">
				<div className="card">Users: {tenant.usage?.userCount || 0}</div>
				<div className="card">Products: {tenant.usage?.productCount || 0}</div>
				<div className="card">Sales: {tenant.usage?.saleCount || 0}</div>
				<div className="card">Customers: {tenant.usage?.customerCount || 0}</div>
			</div>
			<div className="card stack">
				<h3 className="h3">Subscription</h3>
				<div>Plan: {tenant.subscription?.plan || 'n/a'}</div>
				<div>Status: {tenant.subscription?.status || 'n/a'}</div>
				<div>Amount: {tenant.subscription?.amount || 0}</div>
			</div>
			<div className="card stack">
				<h3 className="h3">Users</h3>
				<Table
					columns={[
						{ header: 'Name', key: 'name' },
						{ header: 'Email', key: 'email' },
						{ header: 'Role', key: 'role' },
					]}
					rows={tenant.users || []}
				/>
			</div>
		</div>
	)
}