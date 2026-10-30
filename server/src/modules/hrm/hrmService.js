const { getSupabase } = require('../../config/db')
const { round, add, subtract } = require('../../../../shared/utils/decimal')

async function listEmployees(tenantId, filters = {}) {
	const db = getSupabase()
	let q = db.from('hrm_employees').select('*').eq('tenant_id', tenantId).order('name', { ascending: true })
	if (filters.status) {
		q = q.eq('status', filters.status)
	}
	const { data, error } = await q
	if (error) throw error

	if (!data || data.length === 0) {
		const initialEmployees = [
			{
				tenant_id: tenantId,
				name: 'Samantha Silva',
				role: 'Cashier / Associate',
				department: 'Operations',
				salary_amount: 55000,
				phone: '0712345678',
				email: 'samantha@example.com',
				status: 'active',
			},
			{
				tenant_id: tenantId,
				name: 'Kasun Perera',
				role: 'Store Manager',
				department: 'Management',
				salary_amount: 95000,
				phone: '0778765432',
				email: 'kasun@example.com',
				status: 'active',
			},
		]
		const { data: seeded } = await db.from('hrm_employees').insert(initialEmployees).select()
		return (seeded || initialEmployees).map((e) => ({
			id: e.id,
			name: e.name,
			role: e.role,
			department: e.department,
			salaryAmount: Number(e.salary_amount || 0),
			phone: e.phone,
			email: e.email,
			status: e.status,
		}))
	}

	return data.map((e) => ({
		id: e.id,
		name: e.name,
		role: e.role,
		department: e.department,
		salaryAmount: Number(e.salary_amount || 0),
		phone: e.phone,
		email: e.email,
		status: e.status,
	}))
}

async function createEmployee(tenantId, payload) {
	const name = String(payload.name || '').trim()
	const role = String(payload.role || '').trim()
	if (!name || !role) {
		const err = new Error('Employee name and role are required')
		err.status = 400
		throw err
	}

	const salaryAmount = Number(payload.salaryAmount || 0)
	const { data, error } = await getSupabase()
		.from('hrm_employees')
		.insert({
			tenant_id: tenantId,
			name,
			role,
			department: payload.department || 'General',
			salary_amount: round(salaryAmount, 2),
			phone: payload.phone || '',
			email: payload.email || '',
			status: 'active',
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: data.id,
		name: data.name,
		role: data.role,
		department: data.department,
		salaryAmount: Number(data.salary_amount),
		phone: data.phone,
		email: data.email,
		status: data.status,
	}
}

async function recordAttendance(tenantId, payload) {
	const db = getSupabase()
	const employeeId = payload.employeeId
	const date = payload.date || new Date().toISOString().slice(0, 10)
	if (!employeeId) {
		const err = new Error('Employee ID is required')
		err.status = 400
		throw err
	}

	let employeeName = payload.employeeName || 'Staff'
	const { data: emp } = await db.from('hrm_employees').select('name').eq('id', employeeId).eq('tenant_id', tenantId).maybeSingle()
	if (emp) employeeName = emp.name

	const { data, error } = await db
		.from('hrm_attendance')
		.insert({
			tenant_id: tenantId,
			employee_id: employeeId,
			employee_name: employeeName,
			date,
			check_in: payload.checkIn || new Date().toISOString().slice(11, 16),
			check_out: payload.checkOut || null,
			status: payload.status || 'present',
			notes: payload.notes || '',
		})
		.select()
		.single()
	if (error) throw error

	return {
		id: data.id,
		employeeId: data.employee_id,
		employeeName: data.employee_name,
		date: data.date,
		checkIn: data.check_in,
		checkOut: data.check_out,
		status: data.status,
		notes: data.notes,
	}
}

async function listAttendance(tenantId, filters = {}) {
	const db = getSupabase()
	let q = db.from('hrm_attendance').select('*').eq('tenant_id', tenantId).order('date', { ascending: false })
	if (filters.date) {
		q = q.eq('date', filters.date)
	}
	if (filters.employeeId) {
		q = q.eq('employee_id', filters.employeeId)
	}
	const { data, error } = await q
	if (error) throw error

	return (data || []).map((a) => ({
		id: a.id,
		employeeId: a.employee_id,
		employeeName: a.employee_name,
		date: a.date,
		checkIn: a.check_in,
		checkOut: a.check_out,
		status: a.status,
		notes: a.notes,
	}))
}

async function generatePayroll(tenantId, payload) {
	const db = getSupabase()
	const monthYear = payload.monthYear || new Date().toISOString().slice(0, 7) // 'YYYY-MM'

	let employees = []
	if (payload.employeeId) {
		const { data: emp } = await db.from('hrm_employees').select('*').eq('id', payload.employeeId).eq('tenant_id', tenantId)
		if (emp) employees = emp
	} else {
		const { data: allEmps } = await db.from('hrm_employees').select('*').eq('tenant_id', tenantId).eq('status', 'active')
		employees = allEmps || []
	}

	if (employees.length === 0) {
		const err = new Error('No active employees found to process payroll')
		err.status = 400
		throw err
	}

	const payrollRecords = []
	for (const emp of employees) {
		const baseSalary = Number(emp.salary_amount || 0)
		const bonus = Number(payload.bonus || 0)
		const deductions = Number(payload.deductions || 0)
		const gross = add(baseSalary, bonus)
		const netSalary = Math.max(0, subtract(gross, deductions))

		const row = {
			tenant_id: tenantId,
			employee_id: emp.id,
			employee_name: emp.name,
			month_year: monthYear,
			base_salary: round(baseSalary, 2),
			bonus: round(bonus, 2),
			deductions: round(deductions, 2),
			net_salary: round(netSalary, 2),
			status: 'draft',
			payment_date: null,
		}

		const { data: inserted } = await db.from('hrm_payroll').insert(row).select().single()
		if (inserted) {
			payrollRecords.push({
				id: inserted.id,
				employeeId: inserted.employee_id,
				employeeName: inserted.employee_name,
				monthYear: inserted.month_year,
				baseSalary: Number(inserted.base_salary),
				bonus: Number(inserted.bonus),
				deductions: Number(inserted.deductions),
				netSalary: Number(inserted.net_salary),
				status: inserted.status,
			})
		}
	}

	return payrollRecords
}

async function listPayroll(tenantId, filters = {}) {
	const db = getSupabase()
	let q = db.from('hrm_payroll').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
	if (filters.monthYear) {
		q = q.eq('month_year', filters.monthYear)
	}
	const { data, error } = await q
	if (error) throw error

	return (data || []).map((p) => ({
		id: p.id,
		employeeId: p.employee_id,
		employeeName: p.employee_name,
		monthYear: p.month_year,
		baseSalary: Number(p.base_salary),
		bonus: Number(p.bonus),
		deductions: Number(p.deductions),
		netSalary: Number(p.net_salary),
		status: p.status,
		paymentDate: p.payment_date,
	}))
}

async function markPayrollPaid(tenantId, payrollId) {
	const { data, error } = await getSupabase()
		.from('hrm_payroll')
		.update({
			status: 'paid',
			payment_date: new Date().toISOString(),
		})
		.eq('id', payrollId)
		.eq('tenant_id', tenantId)
		.select()
		.single()
	if (error) throw error
	return data
}

module.exports = {
	listEmployees,
	createEmployee,
	recordAttendance,
	listAttendance,
	generatePayroll,
	listPayroll,
	markPayrollPaid,
}

