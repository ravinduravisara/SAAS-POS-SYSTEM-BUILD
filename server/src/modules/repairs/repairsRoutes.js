const express = require('express')
const auth = require('../../middlewares/authMiddleware')
const tenant = require('../../middlewares/tenantMiddleware')
const plan = require('../../middlewares/planMiddleware')
const controller = require('./repairsController')

const router = express.Router()

router.use(auth, tenant)

// Repairs routes gated by 'repairs.jobCards'
router.get('/jobs', plan('repairs.jobCards'), controller.listJobs)
router.post('/jobs', plan('repairs.jobCards'), controller.createJob)
router.put('/jobs/:id/status', plan('repairs.jobCards'), controller.updateJobStatus)

module.exports = router

