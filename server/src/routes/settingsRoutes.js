const express = require('express')
const auth = require('../middlewares/authMiddleware')
const { getSettings, updateSettings } = require('../controllers/settingsController')

const router = express.Router()

router.get('/', auth, getSettings)
router.put('/', auth, updateSettings)

module.exports = router
