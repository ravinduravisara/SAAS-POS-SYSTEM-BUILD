const express = require('express')
const auth = require('../middlewares/authMiddleware')
const { summary } = require('../controllers/reportController')

const router = express.Router()

router.get('/summary', auth, summary)

module.exports = router
