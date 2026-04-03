import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import Button from '../common/Button.jsx'

export default function Navbar({ onMenu }) {
	const dispatch = useDispatch()
	const user = useSelector((state) => state.auth.user)

	return (
		<div className="navbar">
			<div className="navbar__left">
				<Button variant="secondary" className="navbar__menu" onClick={onMenu}>
					Menu
				</Button>
				<div className="navbar__brand">POS System</div>
			</div>
			<div className="navbar__right">
				{user ? (
					<span className="muted navbar__user">
						{user.name || user.email} ({user.role || 'user'})
					</span>
				) : null}
				<Button variant="secondary" onClick={() => dispatch(logout())}>
					Logout
				</Button>
			</div>
		</div>
	)
}
