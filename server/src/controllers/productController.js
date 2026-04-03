const productService = require('../services/productService')

async function listProducts(req, res, next) {
	try {
		res.json(await productService.list())
	} catch (err) {
		next(err)
	}
}

async function createProduct(req, res, next) {
	try {
		res.status(201).json(await productService.create(req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function updateProduct(req, res, next) {
	try {
		res.json(await productService.update(req.params.id, req.body || {}))
	} catch (err) {
		next(err)
	}
}

async function deleteProduct(req, res, next) {
	try {
		const ok = await productService.remove(req.params.id)
		res.json({ ok })
	} catch (err) {
		next(err)
	}
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct }
