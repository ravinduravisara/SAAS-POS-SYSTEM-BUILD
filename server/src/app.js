const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const corsMiddleware = require('./config/cors')
const { authLimiter, apiLimiter } = require('./middlewares/rateLimitMiddleware')
const errorMiddleware = require('./middlewares/errorMiddleware')

const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const saleRoutes = require('./routes/saleRoutes')
const customerRoutes = require('./routes/customerRoutes')
const reportRoutes = require('./routes/reportRoutes')
const userRoutes = require('./routes/userRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const purchaseRoutes = require('./routes/purchaseRoutes')
const supplierRoutes = require('./routes/supplierRoutes')
const branchRoutes = require('./routes/branchRoutes')
const expenseRoutes = require('./routes/expenseRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const superAdminRoutes = require('./routes/superAdminRoutes')
const restaurantRoutes = require('./modules/restaurant/restaurantRoutes')
const repairsRoutes = require('./modules/repairs/repairsRoutes')
const salonRoutes = require('./modules/salon/salonRoutes')
const hrmRoutes = require('./modules/hrm/hrmRoutes')

const app = express()

app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

if (process.env.NODE_ENV !== 'test') {
	app.use(morgan('dev'))
}

app.use(corsMiddleware())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

// General API rate limiter
app.use('/api', apiLimiter)

// Auth routes with dedicated auth rate limiter
app.use('/api/auth', authLimiter, authRoutes)

// Tenant-level and platform routes
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/super-admin', superAdminRoutes)

// Specialized industry ERP modules
app.use('/api/restaurant', restaurantRoutes)
app.use('/api/repairs', repairsRoutes)
app.use('/api/salon', salonRoutes)
app.use('/api/hrm', hrmRoutes)

app.use(errorMiddleware)

module.exports = app
