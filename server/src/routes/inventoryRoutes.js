const express = require('express')
const auth = require('../middlewares/authMiddleware')
const { listInventory, setStock, adjustStock } = require('../controllers/inventoryController')

const router = express.Router()

router.get('/', auth, listInventory)
router.post('/set', auth, setStock)
router.post('/adjust', auth, adjustStock)

module.exports = router
