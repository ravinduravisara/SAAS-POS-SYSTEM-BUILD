const { getSupabase } = require('../../config/db')
const { round, add } = require('../../../../shared/utils/decimal')

async function listJobs(tenantId, filters = {}) {
	const db = getSupabase()
	let q = db.from('repair_jobs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
	if (filters.status) {
		q = q.eq('status', filters.status)
	}
	const { data, error } = await q
	if (error) throw error
	return (data || []).map((j) => ({
		id: j.id,
		customerName: j.customer_name,
		customerPhone: j.customer_phone || '',
		deviceModel: j.device_model,
		serialNumber: j.serial_number || '',
		problemDescription: j.problem_description,
		technicianName: j.technician_name || 'Unassigned',
		status: j.status,
		laborCost: Number(j.labor_cost || 0),
		partsCost: Number(j.parts_cost || 0),
		totalCost: Number(j.total_cost || 0),
		spareParts: j.spare_parts || [],
		createdAt: j.created_at,
	}))
}

async function createJob(tenantId, payload, user = null) {
	const db = getSupabase()
	const customerName = String(payload.customerName || '').trim()
	const deviceModel = String(payload.deviceModel || '').trim()
	if (!customerName || !deviceModel) {
		const err = new Error('Customer name and device model are required')
		err.status = 400
		throw err
	}

	const laborCost = Number(payload.laborCost || 0)
	const spareParts = Array.isArray(payload.spareParts) ? payload.spareParts : []
	const partsCost = spareParts.reduce((sum, p) => add(sum, Number(p.price || 0) * Number(p.quantity || 1)), 0)
	const totalCost = add(laborCost, partsCost)

	const { data, error } = await db
		.from('repair_jobs')
		.insert({
			tenant_id: tenantId,
			customer_name: customerName,
			customer_phone: payload.customerPhone || '',
			device_model: deviceModel,
			serial_number: payload.serialNumber || '',
			problem_description: payload.problemDescription || 'General diagnostic inspection',
			technician_name: payload.technicianName || user?.name || 'Technician',
			status: 'received',
			labor_cost: round(laborCost, 2),
			parts_cost: round(partsCost, 2),
			total_cost: round(totalCost, 2),
			spare_parts: spareParts,
		})
		.select()
		.single()
	if (error) throw error

	return data
}

async function updateJobStatus(tenantId, jobId, status, partsToConsume = []) {
	const db = getSupabase()
	const validStatuses = new Set([
		'received',
		'under_inspection',
		'awaiting_approval',
		'approved',
		'repairing',
		'waiting_parts',
		'completed',
		'delivered',
		'cancelled',
	])
	if (!validStatuses.has(status)) {
		const err = new Error('Invalid repair status')
		err.status = 400
		throw err
	}

	const { data: job, error: jobErr } = await db
		.from('repair_jobs')
		.select('*')
		.eq('id', jobId)
		.eq('tenant_id', tenantId)
		.single()
	if (jobErr || !job) {
		const err = new Error('Repair job not found')
		err.status = 404
		throw err
	}

	// If moving to completed, consume spare parts from inventory if provided (or from job.spare_parts)
	const partsList = (Array.isArray(partsToConsume) && partsToConsume.length > 0) ? partsToConsume : (job.spare_parts || [])
	if (status === 'completed' && Array.isArray(partsList) && partsList.length > 0) {
		for (const part of partsList) {
			if (!part.productId) continue
			const { data: prod } = await db
				.from('products')
				.select('stock, name')
				.eq('id', part.productId)
				.eq('tenant_id', tenantId)
				.maybeSingle()
			if (prod) {
				const qty = Math.max(1, parseInt(part.quantity, 10) || 1)
				const newStock = Math.max(0, Number(prod.stock || 0) - qty)
				await db.from('products').update({ stock: newStock }).eq('id', part.productId).eq('tenant_id', tenantId)
				await db.from('inventory_logs').insert({
					tenant_id: tenantId,
					product_id: part.productId,
					type: 'adjust',
					delta: -qty,
					note: `Spare part consumed in Repair Job #${jobId}`,
				})
			}
		}
	}

	const { data, error } = await db
		.from('repair_jobs')
		.update({ status })
		.eq('id', jobId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error

	return data
}

module.exports = { listJobs, createJob, updateJobStatus }
