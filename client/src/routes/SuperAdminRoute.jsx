import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export default function SuperAdminRoute() {
	const { token, isSuperAdmin } = useSelector((s) => s.auth)
	if (!token) return <Navigate to="/login" replace />
	if (!isSuperAdmin) return <Navigate to="/dashboard" replace />
	return <Outlet />
}