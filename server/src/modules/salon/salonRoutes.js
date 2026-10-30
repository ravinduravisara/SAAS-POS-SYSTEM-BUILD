const express = require('express')
const auth = require('../../middlewares/authMiddleware')
const tenant = require('../../middlewares/tenantMiddleware')
const plan = require('../../middlewares/planMiddleware')
const controller = require('./salonController')

const router = express.Router()

router.use(auth, tenant)

// Salon features gated by 'salon.appointments'
router.get('/services', plan('salon.appointments'), controller.getServices)
router.post('/services', plan('salon.appointments'), controller.createService)

router.get('/stylists', plan('salon.appointments'), controller.getStylists)
router.post('/stylists', plan('salon.appointments'), controller.createStylist)

router.get('/appointments', plan('salon.appointments'), controller.getAppointments)
router.post('/appointments', plan('salon.appointments'), controller.bookAppointment)
router.put('/appointments/:id/status', plan('salon.appointments'), controller.updateAppointmentStatus)

module.exports = router

