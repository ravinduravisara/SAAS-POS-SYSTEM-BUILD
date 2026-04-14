import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute() {
	const { token, isSuperAdmin } = useSelector((state) => state.auth)
	const location = useLocation()

	if (!token) {
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	if (isSuperAdmin) {
		return <Navigate to="/super-admin" replace />
	}

	return <Outlet />
}
