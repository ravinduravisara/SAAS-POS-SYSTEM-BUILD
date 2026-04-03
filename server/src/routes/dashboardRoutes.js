const express = require('express')
const auth = require('../middlewares/authMiddleware')
const { stats } = require('../controllers/dashboardController')

const router = express.Router()

router.get('/stats', auth, stats)

module.exports = router
