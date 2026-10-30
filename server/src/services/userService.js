const { getSupabase } = require('../config/db')
const { hashPassword } = require('../utils/password')
const { PLAN_FEATURES } = require('../../../shared/constants/plans')

async function list(tenantId) {
	const { data, error } = await getSupabase()
		.from('users')
		.select('id, tenant_id, name, email, role, created_at')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data || []).map((user) => ({
		id: user.id,
		tenantId: user.tenant_id,
		name: user.name,
		email: user.email,
		role: user.role,
		createdAt: user.created_at,
	}))
}

async function create(tenantId, payload) {
	const db = getSupabase()

	// 1. Enforce Subscription Plan User Limits
	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('plan, feature_overrides')
		.eq('id', tenantId)
		.single()
	if (tenantError) throw tenantError

	const planConfig = PLAN_FEATURES[tenant.plan] || PLAN_FEATURES.starter
	const maxUsers = tenant.feature_overrides?.maxUsers !== undefined
		? tenant.feature_overrides.maxUsers
		: planConfig.maxUsers

	if (maxUsers !== -1) {
		const { count, error: countError } = await db
			.from('users')
			.select('id', { count: 'exact', head: true })
			.eq('tenant_id', tenantId)
		if (countError) throw countError

		if ((count || 0) >= maxUsers) {
			const err = new Error(`User limit reached (${maxUsers} maximum) for your current subscription plan. Please upgrade to add more employees.`)
			err.status = 403
			throw err
		}
	}

	const email = String(payload.email || '').trim().toLowerCase()
	if (!email) {
		const err = new Error('Email is required')
		err.status = 400
		throw err
	}

	const password = payload.password
	if (!password || password.length < 8) {
		const err = new Error('Password is required and must be at least 8 characters long')
		err.status = 400
		throw err
	}

	// Check if this email already exists inside this specific tenant
	const { data: existingUser } = await db
		.from('users')
		.select('id')
		.eq('tenant_id', tenantId)
		.eq('email', email)
		.maybeSingle()
	if (existingUser) {
		const err = new Error('A user with this email address already exists in this business')
		err.status = 409
		throw err
	}

	const allowedRoles = new Set(['admin', 'manager', 'cashier', 'accountant', 'technician', 'waiter'])
	const role = allowedRoles.has(payload.role) ? payload.role : 'cashier'

	const { data, error } = await db
		.from('users')
		.insert({
			tenant_id: tenantId,
			name: String(payload.name || '').trim() || 'Employee',
			email,
			role,
			password: hashPassword(password),
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: data.id,
		tenantId: data.tenant_id,
		name: data.name,
		email: data.email,
		role: data.role,
	}
}

async function update(tenantId, userId, payload) {
	const db = getSupabase()
	const updatePayload = {}
	if (payload.name !== undefined) updatePayload.name = String(payload.name).trim()
	if (payload.email !== undefined) updatePayload.email = String(payload.email || '').toLowerCase().trim()
	if (payload.role !== undefined) {
		const allowedRoles = new Set(['admin', 'manager', 'cashier', 'accountant', 'technician', 'waiter'])
		if (allowedRoles.has(payload.role)) updatePayload.role = payload.role
	}
	if (payload.password) {
		if (payload.password.length < 8) {
			const err = new Error('Password must be at least 8 characters long')
			err.status = 400
			throw err
		}
		updatePayload.password = hashPassword(payload.password)
	}

	const { data, error } = await db
		.from('users')
		.update(updatePayload)
		.eq('id', userId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	if (!data) {
		const err = new Error('User not found')
		err.status = 404
		throw err
	}
	return {
		id: data.id,
		tenantId: data.tenant_id,
		name: data.name,
		email: data.email,
		role: data.role,
	}
}

async function remove(tenantId, userId) {
	const { error } = await getSupabase()
		.from('users')
		.delete()
		.eq('id', userId)
		.eq('tenant_id', tenantId)
	if (error) throw error
	return true
}

module.exports = { list, create, update, remove }
