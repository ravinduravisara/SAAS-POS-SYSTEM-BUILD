const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const plan = require('../middlewares/planMiddleware')
const { listInventory, setStock, adjustStock } = require('../controllers/inventoryController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', plan('inventoryManagement'), listInventory)
router.post('/set', plan('inventoryManagement'), setStock)
router.post('/adjust', plan('inventoryManagement'), adjustStock)

module.exports = router
