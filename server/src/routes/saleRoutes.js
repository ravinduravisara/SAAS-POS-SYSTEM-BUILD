const express = require('express')
const auth = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validateMiddleware')
const { saleCreateValidator } = require('../validators/saleValidator')
const { listSales, createSale } = require('../controllers/saleController')

const router = express.Router()

router.get('/', auth, listSales)
router.post('/', auth, validate(saleCreateValidator), createSale)

module.exports = router
