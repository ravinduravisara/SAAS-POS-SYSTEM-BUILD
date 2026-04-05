const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const { listInventory, setStock, adjustStock } = require('../controllers/inventoryController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listInventory)
router.post('/set', setStock)
router.post('/adjust', adjustStock)

module.exports = router
