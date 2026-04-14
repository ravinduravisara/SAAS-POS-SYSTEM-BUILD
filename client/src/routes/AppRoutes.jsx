import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ProtectedRoute from './ProtectedRoute.jsx'
import SuperAdminRoute from './SuperAdminRoute.jsx'

import Login from '../pages/auth/Login.jsx'
import ForgotPassword from '../pages/auth/ForgotPassword.jsx'

import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import POSScreen from '../pages/dashboard/POSScreen.jsx'
import Products from '../pages/dashboard/Products.jsx'
import Categories from '../pages/dashboard/Categories.jsx'
import Inventory from '../pages/dashboard/Inventory.jsx'
import Customers from '../pages/dashboard/Customers.jsx'
import Sales from '../pages/dashboard/Sales.jsx'
import Purchases from '../pages/dashboard/Purchases.jsx'
import Expenses from '../pages/dashboard/Expenses.jsx'
import Reports from '../pages/dashboard/Reports.jsx'
import Users from '../pages/dashboard/Users.jsx'
import Settings from '../pages/dashboard/Settings.jsx'
import NotFound from '../pages/dashboard/NotFound.jsx'
import SuperAdminLayout from '../components/superAdmin/SuperAdminLayout.jsx'
import SuperAdminDashboard from '../pages/superAdmin/SuperAdminDashboard.jsx'
import TenantList from '../pages/superAdmin/TenantList.jsx'
import TenantDetail from '../pages/superAdmin/TenantDetail.jsx'
import Subscriptions from '../pages/superAdmin/Subscriptions.jsx'

function RootRedirect() {
	const { token, isSuperAdmin } = useSelector((state) => state.auth)
	if (!token) return <Navigate to="/login" replace />
	return <Navigate to={isSuperAdmin ? '/super-admin' : '/dashboard'} replace />
}

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<RootRedirect />} />

			<Route path="/login" element={<Login />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />

			<Route path="/super-admin" element={<SuperAdminRoute />}>
				<Route element={<SuperAdminLayout />}>
					<Route index element={<SuperAdminDashboard />} />
					<Route path="tenants" element={<TenantList />} />
					<Route path="tenants/:id" element={<TenantDetail />} />
					<Route path="subscriptions" element={<Subscriptions />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route path="/dashboard" element={<DashboardLayout />}>
					<Route index element={<DashboardHome />} />
					<Route path="pos" element={<POSScreen />} />
					<Route path="products" element={<Products />} />
					<Route path="categories" element={<Categories />} />
					<Route path="inventory" element={<Inventory />} />
					<Route path="customers" element={<Customers />} />
					<Route path="sales" element={<Sales />} />
					<Route path="purchases" element={<Purchases />} />
					<Route path="expenses" element={<Expenses />} />
					<Route path="reports" element={<Reports />} />
					<Route path="users" element={<Users />} />
					<Route path="settings" element={<Settings />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFound />} />
		</Routes>
	)
}
