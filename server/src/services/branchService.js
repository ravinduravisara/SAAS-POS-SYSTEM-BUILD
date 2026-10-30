const { getSupabase } = require('../config/db')

function mapBranch(row) {
	if (!row) return row
	return {
		id: row.id,
		tenantId: row.tenant_id,
		name: row.name,
		code: row.code || '',
		address: row.address || '',
		phone: row.phone || '',
		isDefault: Boolean(row.is_default),
		status: row.status || 'active',
		createdAt: row.created_at,
	}
}

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('business_locations')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: true })
	if (error) throw error

	// If no branches exist yet, initialize a default main branch
	if (!data || data.length === 0) {
		const { data: defaultBranch } = await getSupabase()
			.from('business_locations')
			.insert({
				tenant_id: tenantId,
				name: 'Main Branch',
				code: 'MAIN',
				is_default: true,
				status: 'active',
			})
			.select()
			.single()
		return defaultBranch ? [mapBranch(defaultBranch)] : []
	}

	return data.map(mapBranch)
}

async function create(tenantId, payload) {
	const db = getSupabase()

	// 1. Enforce maxBranches Limit
	const { data: tenant } = await db.from('tenants').select('max_branches, plan').eq('id', tenantId).single()
	const maxBranches = tenant?.max_branches ?? (tenant?.plan === 'enterprise' ? 10 : 1)

	const { count, error: countErr } = await db
		.from('business_locations')
		.select('id', { count: 'exact', head: true })
		.eq('tenant_id', tenantId)
	if (countErr) throw countErr

	if ((count || 0) >= maxBranches) {
		const err = new Error(`Branch limit reached (${maxBranches} maximum) for your current plan. Please contact administrator to expand locations.`)
		err.status = 403
		throw err
	}

	const name = String(payload.name || '').trim()
	if (!name) {
		const err = new Error('Branch name is required')
		err.status = 400
		throw err
	}

	const { data, error } = await db
		.from('business_locations')
		.insert({
			tenant_id: tenantId,
			name,
			code: String(payload.code || name.substring(0, 4)).toUpperCase(),
			address: payload.address || '',
			phone: payload.phone || '',
			is_default: false,
			status: 'active',
		})
		.select()
		.single()
	if (error) throw error

	return mapBranch(data)
}

async function update(tenantId, branchId, payload) {
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = String(payload.name).trim()
	if (payload.code !== undefined) updatePayload.code = String(payload.code).toUpperCase()
	if (payload.address !== undefined) updatePayload.address = payload.address
	if (payload.phone !== undefined) updatePayload.phone = payload.phone
	if (payload.status !== undefined) updatePayload.status = payload.status

	const { data, error } = await getSupabase()
		.from('business_locations')
		.update(updatePayload)
		.eq('id', branchId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	return mapBranch(data)
}

async function remove(tenantId, branchId) {
	const db = getSupabase()
	const { data: branch } = await db.from('business_locations').select('is_default').eq('id', branchId).eq('tenant_id', tenantId).single()
	if (!branch) {
		const err = new Error('Branch not found')
		err.status = 404
		throw err
	}
	if (branch.is_default) {
		const err = new Error('Cannot delete the primary default branch')
		err.status = 400
		throw err
	}

	const { error } = await db.from('business_locations').delete().eq('id', branchId).eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }

