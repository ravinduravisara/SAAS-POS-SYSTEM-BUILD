import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export default function RoleRoute({ allowedRoles = [] }) {
	const role = useSelector((state) => state.auth.user?.role)

	if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
		return <Navigate to="/dashboard" replace />
	}

	return <Outlet />
}
