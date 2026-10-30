const restaurantService = require('./restaurantService')

async function getTables(req, res, next) {
	try {
		res.json(await restaurantService.listTables(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function updateTableStatus(req, res, next) {
	try {
		res.json(await restaurantService.updateTableStatus(req.user.tenantId, req.params.id, req.body?.status))
	} catch (err) {
		next(err)
	}
}

async function getKitchenOrders(req, res, next) {
	try {
		res.json(await restaurantService.listActiveKitchenOrders(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function createOrder(req, res, next) {
	try {
		res.status(201).json(await restaurantService.placeOrder(req.user.tenantId, req.body || {}, req.user))
	} catch (err) {
		next(err)
	}
}

async function updateOrderStatus(req, res, next) {
	try {
		res.json(await restaurantService.updateOrderStatus(req.user.tenantId, req.params.id, req.body?.status))
	} catch (err) {
		next(err)
	}
}

module.exports = {
	getTables,
	updateTableStatus,
	getKitchenOrders,
	createOrder,
	updateOrderStatus,
}

