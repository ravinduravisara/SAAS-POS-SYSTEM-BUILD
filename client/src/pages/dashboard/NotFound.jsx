import { Link } from 'react-router-dom'

export default function NotFound() {
	return (
		<div className="card">
			<h1 className="h1">Not Found</h1>
			<Link to="/dashboard">Go to dashboard</Link>
		</div>
	)
}
