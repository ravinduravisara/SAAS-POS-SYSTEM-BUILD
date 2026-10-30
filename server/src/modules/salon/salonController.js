const salonService = require('./salonService')

async function getServices(req, res, next) {
	try {
		const services = await salonService.listServices(req.tenantId)
		res.json(services)
	} catch (err) {
		next(err)
	}
}

async function createService(req, res, next) {
	try {
		const service = await salonService.createService(req.tenantId, req.body)
		res.status(201).json(service)
	} catch (err) {
		next(err)
	}
}

async function getStylists(req, res, next) {
	try {
		const stylists = await salonService.listStylists(req.tenantId)
		res.json(stylists)
	} catch (err) {
		next(err)
	}
}

async function createStylist(req, res, next) {
	try {
		const stylist = await salonService.createStylist(req.tenantId, req.body)
		res.status(201).json(stylist)
	} catch (err) {
		next(err)
	}
}

async function getAppointments(req, res, next) {
	try {
		const appointments = await salonService.listAppointments(req.tenantId, {
			date: req.query.date,
			stylistId: req.query.stylistId,
		})
		res.json(appointments)
	} catch (err) {
		next(err)
	}
}

async function bookAppointment(req, res, next) {
	try {
		const appointment = await salonService.bookAppointment(req.tenantId, req.body)
		res.status(201).json(appointment)
	} catch (err) {
		next(err)
	}
}

async function updateAppointmentStatus(req, res, next) {
	try {
		const updated = await salonService.updateAppointmentStatus(req.tenantId, req.params.id, req.body.status)
		res.json(updated)
	} catch (err) {
		next(err)
	}
}

module.exports = {
	getServices,
	createService,
	getStylists,
	createStylist,
	getAppointments,
	bookAppointment,
	updateAppointmentStatus,
}

