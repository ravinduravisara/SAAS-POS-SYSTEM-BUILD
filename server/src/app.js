const express = require('express')
const morgan = require('morgan')
const corsMiddleware = require('./config/cors')

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
const expenseRoutes = require('./routes/expenseRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const superAdminRoutes = require('./routes/superAdminRoutes')

const app = express()

app.use(morgan('dev'))
app.use(corsMiddleware())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/super-admin', superAdminRoutes)

app.use(errorMiddleware)

module.exports = app
