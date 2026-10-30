const express = require('express')
const auth = require('../../middlewares/authMiddleware')
const tenant = require('../../middlewares/tenantMiddleware')
const plan = require('../../middlewares/planMiddleware')
const controller = require('./restaurantController')

const router = express.Router()

router.use(auth, tenant)

// Restaurant routes gated by 'restaurant.core'
router.get('/tables', plan('restaurant.core'), controller.getTables)
router.put('/tables/:id/status', plan('restaurant.core'), controller.updateTableStatus)
router.post('/orders', plan('restaurant.core'), controller.createOrder)
router.put('/orders/:id/status', plan('restaurant.core'), controller.updateOrderStatus)

// Kitchen Display System gated by 'restaurant.kitchenDisplay'
router.get('/kitchen/orders', plan('restaurant.kitchenDisplay'), controller.getKitchenOrders)

module.exports = router

