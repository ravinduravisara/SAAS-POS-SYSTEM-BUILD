const express = require('express')
const auth = require('../middlewares/authMiddleware')
const superAdmin = require('../middlewares/superAdminMiddleware')
const controller = require('../controllers/superAdminController')

const router = express.Router()

router.use(auth, superAdmin)

router.get('/features', controller.getFeatureDefinitions)
router.get('/tenants', controller.listTenants)
router.get('/tenants/:id', controller.getTenant)
router.post('/tenants', controller.createTenant)
router.put('/tenants/:id/status', controller.updateTenantStatus)
router.put('/tenants/:id/plan', controller.updateTenantPlan)
router.put('/tenants/:id/features', controller.updateTenantFeatures)
router.put('/tenants/:id/limits', controller.updateTenantLimits)
router.delete('/tenants/:id', controller.deleteTenant)

router.get('/subscriptions', controller.listSubscriptions)
router.put('/subscriptions/:id', controller.updateSubscription)

router.get('/stats', controller.stats)

module.exports = router
