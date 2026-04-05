const inventoryService = require('../services/inventoryService')

async function listInventory(req, res, next) {
	try {
		res.json(await inventoryService.list(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function setStock(req, res, next) {
	try {
		const { productId, stock } = req.body || {}
		res.json(await inventoryService.setStock(req.user.tenantId, productId, stock))
	} catch (err) {
		next(err)
	}
}

async function adjustStock(req, res, next) {
	try {
		const { productId, delta } = req.body || {}
		res.json(await inventoryService.adjustStock(req.user.tenantId, productId, delta))
	} catch (err) {
		next(err)
	}
}

module.exports = { listInventory, setStock, adjustStock }
