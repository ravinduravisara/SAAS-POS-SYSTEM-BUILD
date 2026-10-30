const express = require('express')
const auth = require('../../middlewares/authMiddleware')
const tenant = require('../../middlewares/tenantMiddleware')
const plan = require('../../middlewares/planMiddleware')
const controller = require('./hrmController')

const router = express.Router()

router.use(auth, tenant)

// HRM core features gated by 'hrm.core'
router.get('/employees', plan('hrm.core'), controller.getEmployees)
router.post('/employees', plan('hrm.core'), controller.createEmployee)
router.get('/attendance', plan('hrm.core'), controller.getAttendance)
router.post('/attendance', plan('hrm.core'), controller.recordAttendance)

// Payroll features gated by 'hrm.payroll'
router.get('/payroll', plan('hrm.payroll'), controller.getPayroll)
router.post('/payroll/generate', plan('hrm.payroll'), controller.generatePayroll)
router.put('/payroll/:id/pay', plan('hrm.payroll'), controller.markPayrollPaid)

module.exports = router

