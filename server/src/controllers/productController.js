const productService = require('../services/productService')

async function listProducts(req, res, next) {
	try {
		res.json(await productService.list(req.user.tenantId))
	} catch (err) {
		next(err)
	}
}

async function createProduct(req, res, next) {
	try {
		res.status(201).json(await productService.create(req.user.tenantId, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function updateProduct(req, res, next) {
	try {
		res.json(await productService.update(req.user.tenantId, req.params.id, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function deleteProduct(req, res, next) {
	try {
		const ok = await productService.remove(req.user.tenantId, req.params.id)
		res.json({ ok })
	} catch (err) {
		next(err)
	}
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct }
