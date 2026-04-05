const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const plan = require('../middlewares/planMiddleware')
const { summary } = require('../controllers/reportController')

const router = express.Router()

router.use(auth, tenant)
router.get('/summary', plan('reports'), summary)

module.exports = router
