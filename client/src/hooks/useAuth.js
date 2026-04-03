import { useSelector } from 'react-redux'

export default function useAuth() {
	const token = useSelector((state) => state.auth.token)
	const user = useSelector((state) => state.auth.user)
	return { token, user, isAuthenticated: Boolean(token) }
}
