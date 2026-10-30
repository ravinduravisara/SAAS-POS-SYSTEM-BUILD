const { getSupabase } = require('../config/db')
const { generateToken } = require('../utils/generateToken')
const { resolvePlanFeatures } = require('../utils/planFeatures')
const { hashPassword, verifyPassword, isHashedPassword } = require('../utils/password')

async function recordAuditLog(db, { tenantId = null, userId = null, action, resource, details = {}, ip = null }) {
	try {
		await db.from('audit_logs').insert({
			tenant_id: tenantId,
			user_id: userId,
			action,
			resource,
			details,
			ip_address: ip,
			created_at: new Date().toISOString(),
		})
	} catch (e) {
		// Non-blocking error for audit logging
	}
}

async function login({ email, password, tenantId = null, ip = null }) {
	const db = getSupabase()
	const normalizedEmail = String(email || '').trim().toLowerCase()

	if (!normalizedEmail || !password) {
		const err = new Error('Email and password are required')
		err.status = 400
		throw err
	}

	// 1. Check if user is Super Admin
	const { data: sa, error: superAdminError } = await db
		.from('super_admins')
		.select('*')
		.eq('email', normalizedEmail)
		.maybeSingle()
	if (superAdminError) throw superAdminError

	if (sa && verifyPassword(password, sa.password)) {
		if (!isHashedPassword(sa.password)) {
			await db.from('super_admins').update({ password: hashPassword(password) }).eq('id', sa.id)
		}
		const token = generateToken({ userId: sa.id, role: 'superadmin' })
		await recordAuditLog(db, { userId: sa.id, action: 'LOGIN_SUCCESS', resource: 'super_admins', ip })
		return {
			token,
			isSuperAdmin: true,
			user: { id: sa.id, email: sa.email, role: 'superadmin', name: 'Super Admin' },
		}
	}

	// 2. Query tenant user accounts
	let query = db
		.from('users')
		.select('id, tenant_id, name, email, password, role')
		.eq('email', normalizedEmail)

	if (tenantId) {
		query = query.eq('tenant_id', tenantId)
	}

	const { data: users, error } = await query
	if (error) throw error

	if (!users || users.length === 0) {
		await recordAuditLog(db, { action: 'LOGIN_FAILURE', resource: 'users', details: { email: normalizedEmail, reason: 'User not found' }, ip })
		const err = new Error('Invalid credentials')
		err.status = 401
		throw err
	}

	// If multiple tenant accounts share the same email and no tenantId was specified:
	if (users.length > 1 && !tenantId) {
		// Verify which accounts match the password
		const validMatchingAccounts = users.filter((u) => verifyPassword(password, u.password))
		if (validMatchingAccounts.length === 0) {
			await recordAuditLog(db, { action: 'LOGIN_FAILURE', resource: 'users', details: { email: normalizedEmail, reason: 'Invalid password' }, ip })
			const err = new Error('Invalid credentials')
			err.status = 401
			throw err
		}

		if (validMatchingAccounts.length === 1) {
			// Exactly one tenant account matched the password
			return completeTenantLogin(db, validMatchingAccounts[0], password, ip)
		}

		// Multiple tenant accounts match! Prompt tenant selection to disambiguate
		const tenantIds = validMatchingAccounts.map((u) => u.tenant_id)
		const { data: tenantList } = await db.from('tenants').select('id, name, slug, status').in('id', tenantIds)
		return {
			requiresTenantSelection: true,
			message: 'Multiple business accounts found. Please select a workspace.',
			tenants: (tenantList || []).map((t) => ({
				id: t.id,
				name: t.name,
				slug: t.slug,
				status: t.status,
			})),
		}
	}

	const targetUser = users[0]
	if (!verifyPassword(password, targetUser.password)) {
		await recordAuditLog(db, { tenantId: targetUser.tenant_id, userId: targetUser.id, action: 'LOGIN_FAILURE', resource: 'users', details: { email: normalizedEmail, reason: 'Invalid password' }, ip })
		const err = new Error('Invalid credentials')
		err.status = 401
		throw err
	}

	return completeTenantLogin(db, targetUser, password, ip)
}

async function completeTenantLogin(db, user, plainPassword, ip) {
	// Auto-upgrade legacy or plaintext passwords to PBKDF2
	if (!isHashedPassword(user.password)) {
		await db.from('users').update({ password: hashPassword(plainPassword) }).eq('id', user.id)
	}

	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('id, name, slug, plan, status, feature_overrides, trial_ends_at')
		.eq('id', user.tenant_id)
		.single()
	if (tenantError || !tenant) {
		const err = new Error('Tenant not found')
		err.status = 404
		throw err
	}

	if (tenant.status === 'suspended') {
		const err = new Error('Account suspended. Please contact platform support.')
		err.status = 403
		throw err
	}

	if (tenant.status === 'cancelled') {
		const err = new Error('Subscription cancelled.')
		err.status = 403
		throw err
	}

	// Check trial expiration
	if (tenant.status === 'trial' && tenant.trial_ends_at) {
		if (new Date(tenant.trial_ends_at).getTime() < Date.now()) {
			const err = new Error('Your trial period has expired. Please subscribe to continue.')
			err.status = 403
			throw err
		}
	}

	const { data: subscriptions, error: subscriptionError } = await db
		.from('subscriptions')
		.select('*')
		.eq('tenant_id', tenant.id)
		.order('created_at', { ascending: false })
		.limit(1)
	if (subscriptionError) throw subscriptionError
	const subscription = subscriptions?.[0] || null

	const token = generateToken({
		userId: user.id,
		tenantId: tenant.id,
		role: user.role,
		email: user.email,
	})

	await recordAuditLog(db, {
		tenantId: tenant.id,
		userId: user.id,
		action: 'LOGIN_SUCCESS',
		resource: 'users',
		ip,
	})

	return {
		token,
		isSuperAdmin: false,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			tenantId: tenant.id,
		},
		tenant: {
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
			plan: tenant.plan,
			status: tenant.status,
			trialEndsAt: tenant.trial_ends_at,
		},
		subscription,
		planFeatures: resolvePlanFeatures(tenant.plan, tenant.feature_overrides || {}),
	}
}

async function me(userId, tenantId) {
	const db = getSupabase()

	if (!tenantId) {
		const { data: user, error } = await db.from('super_admins').select('id, email').eq('id', userId).single()
		if (error) throw error
		return { user: user ? { ...user, role: 'superadmin', name: 'Super Admin' } : null, tenant: null, subscription: null }
	}

	const { data: user, error: userError } = await db
		.from('users')
		.select('id, name, email, role, tenant_id')
		.eq('id', userId)
		.eq('tenant_id', tenantId)
		.single()
	if (userError) throw userError

	const { data: tenant, error: tenantError } = await db
		.from('tenants')
		.select('id, name, slug, plan, status, trial_ends_at, feature_overrides')
		.eq('id', tenantId)
		.single()
	if (tenantError) throw tenantError

	const { data: subscriptions, error: subscriptionError } = await db
		.from('subscriptions')
		.select('*')
		.eq('tenant_id', tenantId)
		.order('created_at', { ascending: false })
		.limit(1)
	if (subscriptionError) throw subscriptionError

	const subscription = subscriptions?.[0] || null
	return {
		user: { ...user, tenantId: user.tenant_id },
		tenant: {
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
			plan: tenant.plan,
			status: tenant.status,
			trialEndsAt: tenant.trial_ends_at,
		},
		subscription,
		planFeatures: resolvePlanFeatures(tenant.plan, tenant.feature_overrides || {}),
	}
}

async function changePassword({ userId, tenantId, oldPassword, newPassword }) {
	const db = getSupabase()
	if (!newPassword || newPassword.length < 8) {
		const err = new Error('New password must be at least 8 characters long')
		err.status = 400
		throw err
	}

	if (!tenantId) {
		// Super Admin
		const { data: sa, error } = await db.from('super_admins').select('id, password').eq('id', userId).single()
		if (error || !sa) {
			const err = new Error('User not found')
			err.status = 404
			throw err
		}
		if (!verifyPassword(oldPassword, sa.password)) {
			const err = new Error('Current password does not match')
			err.status = 400
			throw err
		}
		await db.from('super_admins').update({ password: hashPassword(newPassword) }).eq('id', userId)
		return { ok: true, message: 'Password updated successfully' }
	}

	// Tenant User
	const { data: user, error } = await db.from('users').select('id, password').eq('id', userId).eq('tenant_id', tenantId).single()
	if (error || !user) {
		const err = new Error('User not found')
		err.status = 404
		throw err
	}

	if (!verifyPassword(oldPassword, user.password)) {
		const err = new Error('Current password does not match')
		err.status = 400
		throw err
	}

	await db.from('users').update({ password: hashPassword(newPassword) }).eq('id', userId).eq('tenant_id', tenantId)
	await recordAuditLog(db, { tenantId, userId, action: 'PASSWORD_CHANGE', resource: 'users' })
	return { ok: true, message: 'Password updated successfully' }
}

module.exports = { login, me, changePassword }
