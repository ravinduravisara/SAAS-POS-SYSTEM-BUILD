const hrmService = require('./hrmService')

async function getEmployees(req, res, next) {
	try {
		const employees = await hrmService.listEmployees(req.tenantId, { status: req.query.status })
		res.json(employees)
	} catch (err) {
		next(err)
	}
}

async function createEmployee(req, res, next) {
	try {
		const employee = await hrmService.createEmployee(req.tenantId, req.body)
		res.status(201).json(employee)
	} catch (err) {
		next(err)
	}
}

async function getAttendance(req, res, next) {
	try {
		const logs = await hrmService.listAttendance(req.tenantId, {
			date: req.query.date,
			employeeId: req.query.employeeId,
		})
		res.json(logs)
	} catch (err) {
		next(err)
	}
}

async function recordAttendance(req, res, next) {
	try {
		const record = await hrmService.recordAttendance(req.tenantId, req.body)
		res.status(201).json(record)
	} catch (err) {
		next(err)
	}
}

async function getPayroll(req, res, next) {
	try {
		const payroll = await hrmService.listPayroll(req.tenantId, { monthYear: req.query.monthYear })
		res.json(payroll)
	} catch (err) {
		next(err)
	}
}

async function generatePayroll(req, res, next) {
	try {
		const runs = await hrmService.generatePayroll(req.tenantId, req.body)
		res.status(201).json(runs)
	} catch (err) {
		next(err)
	}
}

async function markPayrollPaid(req, res, next) {
	try {
		const updated = await hrmService.markPayrollPaid(req.tenantId, req.params.id)
		res.json(updated)
	} catch (err) {
		next(err)
	}
}

module.exports = {
	getEmployees,
	createEmployee,
	getAttendance,
	recordAttendance,
	getPayroll,
	generatePayroll,
	markPayrollPaid,
}

