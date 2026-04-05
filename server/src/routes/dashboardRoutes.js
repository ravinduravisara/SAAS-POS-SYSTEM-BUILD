const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const { stats } = require('../controllers/dashboardController')

const router = express.Router()

router.use(auth, tenant)
router.get('/stats', stats)

module.exports = router
