import { useState, useEffect } from 'react'
import {
	getEmployees,
	createEmployee,
	getAttendance,
	recordAttendance,
	getPayroll,
	generatePayroll,
	markPayrollPaid,
} from '../../services/hrmService'

export default function HRMManagement() {
	const [activeTab, setActiveTab] = useState('employees') // 'employees' | 'attendance' | 'payroll'
	const [employees, setEmployees] = useState([])
	const [attendance, setAttendance] = useState([])
	const [payroll, setPayroll] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')

	// Modals
	const [showEmpModal, setShowEmpModal] = useState(false)
	const [empForm, setEmpForm] = useState({
		name: '',
		role: '',
		department: 'Operations',
		salaryAmount: 50000,
		phone: '',
		email: '',
	})

	const [showClockModal, setShowClockModal] = useState(false)
	const [clockForm, setClockForm] = useState({
		employeeId: '',
		date: new Date().toISOString().slice(0, 10),
		checkIn: '08:30',
		status: 'present',
	})

	const [showPayrollModal, setShowPayrollModal] = useState(false)
	const [payrollForm, setPayrollForm] = useState({
		monthYear: new Date().toISOString().slice(0, 7),
		bonus: 0,
		deductions: 0,
	})

	const loadData = async () => {
		try {
			setLoading(true)
			setError('')
			const [emps, atts, pays] = await Promise.all([
				getEmployees(),
				getAttendance(),
				getPayroll(),
			])
			setEmployees(emps || [])
			setAttendance(atts || [])
			setPayroll(pays || [])
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to load HRM data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleAddEmployee = async (e) => {
		e.preventDefault()
		try {
			await createEmployee(empForm)
			setSuccessMsg('Employee registered successfully')
			setTimeout(() => setSuccessMsg(''), 3000)
			setShowEmpModal(false)
			setEmpForm({
				name: '',
				role: '',
				department: 'Operations',
				salaryAmount: 50000,
				phone: '',
				email: '',
			})
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const handleRecordAttendance = async (e) => {
		e.preventDefault()
		try {
			await recordAttendance({
				employeeId: clockForm.employeeId || employees[0]?.id,
				date: clockForm.date,
				checkIn: clockForm.checkIn,
				status: clockForm.status,
			})
			setSuccessMsg('Attendance logged successfully')
			setTimeout(() => setSuccessMsg(''), 3000)
			setShowClockModal(false)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const handleGeneratePayroll = async (e) => {
		e.preventDefault()
		try {
			await generatePayroll({
				monthYear: payrollForm.monthYear,
				bonus: Number(payrollForm.bonus || 0),
				deductions: Number(payrollForm.deductions || 0),
			})
			setSuccessMsg('Monthly payroll generated successfully')
			setTimeout(() => setSuccessMsg(''), 3000)
			setShowPayrollModal(false)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	const handlePaySlip = async (id) => {
		try {
			await markPayrollPaid(id)
			setSuccessMsg('Payroll status marked as Paid')
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}

	return (
		<div className="pos-screen" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
				<div>
					<h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>HRM & Payroll Management</h1>
					<p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
						Manage staff roster, department assignments, daily attendance logs, and monthly salary disbursement.
					</p>
				</div>
				<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
					<button
						type="button"
						className={`btn ${activeTab === 'employees' ? 'btn--primary' : 'btn--secondary'}`}
						onClick={() => setActiveTab('employees')}
					>
						Staff Directory ({employees.length})
					</button>
					<button
						type="button"
						className={`btn ${activeTab === 'attendance' ? 'btn--primary' : 'btn--secondary'}`}
						onClick={() => setActiveTab('attendance')}
					>
						Attendance Log
					</button>
					<button
						type="button"
						className={`btn ${activeTab === 'payroll' ? 'btn--primary' : 'btn--secondary'}`}
						onClick={() => setActiveTab('payroll')}
					>
						Payroll Processing
					</button>
				</div>
			</div>

			{error && (
				<div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '6px', marginBottom: '1rem' }}>
					{successMsg}
				</div>
			)}

			{loading ? (
				<p>Loading HRM records...</p>
			) : activeTab === 'employees' ? (
				<div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
						<button type="button" className="btn btn--primary" onClick={() => setShowEmpModal(true)}>
							+ Add Staff Member
						</button>
					</div>
					<div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
									<th style={{ padding: '0.75rem 1rem' }}>Employee Name</th>
									<th style={{ padding: '0.75rem 1rem' }}>Role & Department</th>
									<th style={{ padding: '0.75rem 1rem' }}>Contact Info</th>
									<th style={{ padding: '0.75rem 1rem' }}>Base Salary</th>
									<th style={{ padding: '0.75rem 1rem' }}>Status</th>
								</tr>
							</thead>
							<tbody>
								{employees.map((e) => (
									<tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
										<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{e.name}</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<div>{e.role}</div>
											<div style={{ color: '#64748b', fontSize: '0.75rem' }}>{e.department}</div>
										</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<div>{e.phone}</div>
											<div style={{ color: '#64748b', fontSize: '0.75rem' }}>{e.email}</div>
										</td>
										<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
											Rs. {Number(e.salaryAmount || 0).toLocaleString()}
										</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#d1fae5', color: '#047857' }}>
												{e.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			) : activeTab === 'attendance' ? (
				<div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
						<button type="button" className="btn btn--primary" onClick={() => setShowClockModal(true)}>
							+ Log Attendance
						</button>
					</div>
					<div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
									<th style={{ padding: '0.75rem 1rem' }}>Date</th>
									<th style={{ padding: '0.75rem 1rem' }}>Employee</th>
									<th style={{ padding: '0.75rem 1rem' }}>Check In</th>
									<th style={{ padding: '0.75rem 1rem' }}>Check Out</th>
									<th style={{ padding: '0.75rem 1rem' }}>Status</th>
								</tr>
							</thead>
							<tbody>
								{attendance.length === 0 ? (
									<tr>
										<td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
											No attendance logged yet.
										</td>
									</tr>
								) : (
									attendance.map((a) => (
										<tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
											<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{a.date}</td>
											<td style={{ padding: '0.75rem 1rem' }}>{a.employeeName}</td>
											<td style={{ padding: '0.75rem 1rem' }}>{a.checkIn}</td>
											<td style={{ padding: '0.75rem 1rem' }}>{a.checkOut || '-'}</td>
											<td style={{ padding: '0.75rem 1rem' }}>
												<span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#d1fae5', color: '#047857' }}>
													{a.status}
												</span>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			) : (
				<div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
						<button type="button" className="btn btn--primary" onClick={() => setShowPayrollModal(true)}>
							+ Run Monthly Payroll
						</button>
					</div>
					<div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
									<th style={{ padding: '0.75rem 1rem' }}>Month</th>
									<th style={{ padding: '0.75rem 1rem' }}>Staff Name</th>
									<th style={{ padding: '0.75rem 1rem' }}>Base Salary</th>
									<th style={{ padding: '0.75rem 1rem' }}>Bonus / Allowances</th>
									<th style={{ padding: '0.75rem 1rem' }}>Deductions</th>
									<th style={{ padding: '0.75rem 1rem' }}>Net Disbursed</th>
									<th style={{ padding: '0.75rem 1rem' }}>Status</th>
									<th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
								</tr>
							</thead>
							<tbody>
								{payroll.length === 0 ? (
									<tr>
										<td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
											No payroll runs recorded yet. Click &quot;+ Run Monthly Payroll&quot; to compute employee earnings.
										</td>
									</tr>
								) : (
									payroll.map((p) => (
										<tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
											<td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.monthYear}</td>
											<td style={{ padding: '0.75rem 1rem' }}>{p.employeeName}</td>
											<td style={{ padding: '0.75rem 1rem' }}>Rs. {p.baseSalary?.toLocaleString()}</td>
											<td style={{ padding: '0.75rem 1rem', color: '#16a34a' }}>+Rs. {p.bonus?.toLocaleString()}</td>
											<td style={{ padding: '0.75rem 1rem', color: '#dc2626' }}>-Rs. {p.deductions?.toLocaleString()}</td>
											<td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Rs. {p.netSalary?.toLocaleString()}</td>
											<td style={{ padding: '0.75rem 1rem' }}>
												<span
													style={{
														padding: '0.2rem 0.5rem',
														borderRadius: '12px',
														fontSize: '0.75rem',
														fontWeight: 600,
														background: p.status === 'paid' ? '#d1fae5' : '#fef3c7',
														color: p.status === 'paid' ? '#047857' : '#b45309',
													}}
												>
													{p.status}
												</span>
											</td>
											<td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
												{p.status === 'draft' && (
													<button
														type="button"
														className="btn btn--primary"
														style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
														onClick={() => handlePaySlip(p.id)}
													>
														Disburse Salary
													</button>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Add Employee Modal */}
			{showEmpModal && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
					<div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
						<h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>Add Staff Member</h2>
						<form onSubmit={handleAddEmployee}>
							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Full Name *</label>
								<input
									type="text"
									required
									value={empForm.name}
									onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Role *</label>
									<input
										type="text"
										required
										placeholder="e.g. Cashier"
										value={empForm.role}
										onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Department</label>
									<input
										type="text"
										value={empForm.department}
										onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>
							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Base Salary (Rs.) *</label>
								<input
									type="number"
									required
									value={empForm.salaryAmount}
									onChange={(e) => setEmpForm({ ...empForm, salaryAmount: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Phone</label>
									<input
										type="text"
										value={empForm.phone}
										onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Email</label>
									<input
										type="email"
										value={empForm.email}
										onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
								<button type="button" className="btn btn--secondary" onClick={() => setShowEmpModal(false)}>
									Cancel
								</button>
								<button type="submit" className="btn btn--primary">
									Save Employee
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Clock-in Modal */}
			{showClockModal && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
					<div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
						<h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>Log Daily Attendance</h2>
						<form onSubmit={handleRecordAttendance}>
							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Select Employee *</label>
								<select
									value={clockForm.employeeId}
									onChange={(e) => setClockForm({ ...clockForm, employeeId: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								>
									{employees.map((e) => (
										<option key={e.id} value={e.id}>
											{e.name} ({e.role})
										</option>
									))}
								</select>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Date</label>
									<input
										type="date"
										value={clockForm.date}
										onChange={(e) => setClockForm({ ...clockForm, date: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Check In Time</label>
									<input
										type="time"
										value={clockForm.checkIn}
										onChange={(e) => setClockForm({ ...clockForm, checkIn: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
								<button type="button" className="btn btn--secondary" onClick={() => setShowClockModal(false)}>
									Cancel
								</button>
								<button type="submit" className="btn btn--primary">
									Record Attendance
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Payroll Modal */}
			{showPayrollModal && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
					<div style={{ background: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
						<h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>Generate Monthly Payroll</h2>
						<form onSubmit={handleGeneratePayroll}>
							<div style={{ marginBottom: '0.75rem' }}>
								<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Payroll Period (YYYY-MM)</label>
								<input
									type="month"
									required
									value={payrollForm.monthYear}
									onChange={(e) => setPayrollForm({ ...payrollForm, monthYear: e.target.value })}
									style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
								/>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Standard Bonus (Rs.)</label>
									<input
										type="number"
										value={payrollForm.bonus}
										onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Deductions (Rs.)</label>
									<input
										type="number"
										value={payrollForm.deductions}
										onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
										style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
									/>
								</div>
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
								<button type="button" className="btn btn--secondary" onClick={() => setShowPayrollModal(false)}>
									Cancel
								</button>
								<button type="submit" className="btn btn--primary">
									Process Payroll Run
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

