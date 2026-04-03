import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'

export default function ForgotPassword() {
	const [email, setEmail] = useState('')
	const [sent, setSent] = useState(false)

	function onSubmit(e) {
		e.preventDefault()
		setSent(true)
	}

	return (
		<div className="auth">
			<form className="card" onSubmit={onSubmit}>
				<h1 className="h1">Forgot Password</h1>
				<Input
					label="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<Button type="submit">Send reset link</Button>
				{sent ? (
					<div className="muted">If this email exists, a link will be sent.</div>
				) : null}
				<div className="auth__links">
					<Link to="/login">Back to login</Link>
				</div>
			</form>
		</div>
	)
}
