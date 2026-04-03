const reportService = require('../services/reportService')
const { store } = require('../data/store')

async function stats(req, res, next) {
	try {
		const summary = await reportService.summary()
		const lowStock = store.products.filter((p) => Number(p.stock || 0) <= 5).length
		res.json({
			...summary,
			lowStock,
			products: store.products.length,
			customers: store.customers.length,
		})
	} catch (err) {
		next(err)
	}
}

module.exports = { stats }
