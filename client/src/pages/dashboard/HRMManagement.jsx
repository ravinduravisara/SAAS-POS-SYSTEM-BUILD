import { useState, useEffect, useMemo, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import DataTable from '../../components/common/DataTable.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import Input from '../../components/common/Input.jsx'
import {
	getEmployees,
	createEmployee,
	getAttendance,
	recordAttendance,
	getPayroll,
	generatePayroll,
	markPayrollPaid,
} from '../../services/hrmService'
import { formatCurrency } from '../../utils/formatCurrency'

export default function HRMManagement() {
	const [activeTab, setActiveTab] = useState('employees') // 'employees' | 'attendance' | 'payroll'
	const [employees, setEmployees] = useState([])
	const [attendance, setAttendance] = useState([])
	const [payroll, setPayroll] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [successMsg, setSuccessMsg] = useState('')

	// Search states
	const [empSearch, setEmpSearch] = useState('')
	const [attSearch, setAttSearch] = useState('')
	const [paySearch, setPaySearch] = useState('')

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

	const loadData = useCallback(async () => {
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
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

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

	const handlePaySlip = useCallback(async (id) => {
		try {
			await markPayrollPaid(id)
			setSuccessMsg('Payroll status marked as Paid')
			setTimeout(() => setSuccessMsg(''), 3000)
			loadData()
		} catch (err) {
			setError(err.response?.data?.message || err.message)
		}
	}, [loadData])

	// Filtered data
	const filteredEmployees = useMemo(() => {
		if (!empSearch.trim()) return employees
		const q = empSearch.toLowerCase()
		return employees.filter(
			(e) =>
				e.name?.toLowerCase().includes(q) ||
				e.role?.toLowerCase().includes(q) ||
				e.department?.toLowerCase().includes(q),
		)
	}, [employees, empSearch])

	const filteredAttendance = useMemo(() => {
		if (!attSearch.trim()) return attendance
		const q = attSearch.toLowerCase()
		return attendance.filter(
			(a) =>
				a.employeeName?.toLowerCase().includes(q) ||
				a.date?.toLowerCase().includes(q) ||
				a.status?.toLowerCase().includes(q),
		)
	}, [attendance, attSearch])

	const filteredPayroll = useMemo(() => {
		if (!paySearch.trim()) return payroll
		const q = paySearch.toLowerCase()
		return payroll.filter(
			(p) =>
				p.employeeName?.toLowerCase().includes(q) ||
				p.monthYear?.toLowerCase().includes(q) ||
				p.status?.toLowerCase().includes(q),
		)
	}, [payroll, paySearch])

	const employeeColumns = useMemo(
		() => [
			{
				label: 'Employee Name',
				key: 'name',
				render: (row) => (
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<div
							style={{
								width: '32px',
								height: '32px',
								borderRadius: '50%',
								backgroundColor: '#e0e7ff',
								color: '#4338ca',
								fontWeight: 700,
								fontSize: '0.8rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{row.name ? row.name.charAt(0).toUpperCase() : 'E'}
						</div>
						<span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
					</div>
				),
			},
			{
				label: 'Role & Department',
				key: 'role',
				render: (row) => (
					<div>
						<div style={{ color: '#0f172a', fontWeight: 500 }}>{row.role}</div>
						<div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.department}</div>
					</div>
				),
			},
			{
				label: 'Contact Info',
				key: 'phone',
				render: (row) => (
					<div style={{ fontSize: '0.85rem' }}>
						<div style={{ color: '#0f172a' }}>{row.phone || '—'}</div>
						{row.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.email}</div>}
					</div>
				),
			},
			{
				label: 'Base Salary',
				key: 'salaryAmount',
				render: (row) => (
					<span style={{ fontWeight: 700, color: '#0f172a' }}>
						{formatCurrency(row.salaryAmount || 0)}
					</span>
				),
			},
			{
				label: 'Status',
				key: 'status',
				render: (row) => (
					<StatusBadge
						status={row.status === 'active' ? 'success' : 'default'}
						label={row.status}
					/>
				),
			},
		],
		[],
	)

	const attendanceColumns = useMemo(
		() => [
			{
				label: 'Date',
				key: 'date',
				render: (row) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.date}</span>,
			},
			{
				label: 'Employee',
				key: 'employeeName',
				render: (row) => <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.employeeName}</span>,
			},
			{
				label: 'Check In',
				key: 'checkIn',
				render: (row) => <span style={{ color: '#0f172a' }}>{row.checkIn}</span>,
			},
			{
				label: 'Check Out',
				key: 'checkOut',
				render: (row) => <span style={{ color: '#64748b' }}>{row.checkOut || '—'}</span>,
			},
			{
				label: 'Attendance Status',
				key: 'status',
				render: (row) => (
					<StatusBadge
						status={row.status === 'present' ? 'success' : 'warning'}
						label={row.status}
					/>
				),
			},
		],
		[],
	)

	const payrollColumns = useMemo(
		() => [
			{
				label: 'Month',
				key: 'monthYear',
				render: (row) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.monthYear}</span>,
			},
			{
				label: 'Staff Member',
				key: 'employeeName',
				render: (row) => <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.employeeName}</span>,
			},
			{
				label: 'Base Salary',
				key: 'baseSalary',
				render: (row) => <span>{formatCurrency(row.baseSalary || 0)}</span>,
			},
			{
				label: 'Bonus / Allowances',
				key: 'bonus',
				render: (row) => (
					<span style={{ color: '#16a34a', fontWeight: 500 }}>
						+{formatCurrency(row.bonus || 0)}
					</span>
				),
			},
			{
				label: 'Deductions',
				key: 'deductions',
				render: (row) => (
					<span style={{ color: '#dc2626', fontWeight: 500 }}>
						-{formatCurrency(row.deductions || 0)}
					</span>
				),
			},
			{
				label: 'Net Payable',
				key: 'netSalary',
				render: (row) => (
					<strong style={{ color: '#0f172a' }}>
						{formatCurrency(row.netSalary || 0)}
					</strong>
				),
			},
			{
				label: 'Status',
				key: 'status',
				render: (row) => (
					<StatusBadge
						status={row.status === 'paid' ? 'success' : 'warning'}
						label={row.status}
					/>
				),
			},
			{
				label: 'Actions',
				key: 'actions',
				width: '130px',
				render: (row) => (
					<div>
						{row.status === 'draft' && (
							<Button
								size="sm"
								onClick={() => handlePaySlip(row.id)}
							>
								Disburse Salary
							</Button>
						)}
					</div>
				),
			},
		],
		[handlePaySlip],
	)

	return (
		<div className="stack">
			<PageHeader
				title="HRM & Payroll Management"
				subtitle="Manage staff roster, department assignments, daily attendance logs, and monthly salary disbursement."
				actions={
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button
							variant={activeTab === 'employees' ? 'primary' : 'secondary'}
							onClick={() => setActiveTab('employees')}
						>
							Staff Directory ({employees.length})
						</Button>
						<Button
							variant={activeTab === 'attendance' ? 'primary' : 'secondary'}
							onClick={() => setActiveTab('attendance')}
						>
							Attendance
						</Button>
						<Button
							variant={activeTab === 'payroll' ? 'primary' : 'secondary'}
							onClick={() => setActiveTab('payroll')}
						>
							Payroll
						</Button>
					</div>
				}
			/>

			{error && (
				<div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
					{error}
				</div>
			)}
			{successMsg && (
				<div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
					{successMsg}
				</div>
			)}

			{activeTab === 'employees' && (
				<div className="card" style={{ padding: '1.25rem' }}>
					<DataTable
						columns={employeeColumns}
						data={filteredEmployees}
						loading={loading}
						searchQuery={empSearch}
						onSearchChange={setEmpSearch}
						searchPlaceholder="Search staff by name, role, or department..."
						actions={
							<Button onClick={() => setShowEmpModal(true)}>
								+ Add Staff Member
							</Button>
						}
						emptyTitle="No staff members registered"
						emptyDescription="No employee profiles found."
						emptyActionText="+ Add Staff Member"
						onEmptyAction={() => setShowEmpModal(true)}
					/>
				</div>
			)}

			{activeTab === 'attendance' && (
				<div className="card" style={{ padding: '1.25rem' }}>
					<DataTable
						columns={attendanceColumns}
						data={filteredAttendance}
						loading={loading}
						searchQuery={attSearch}
						onSearchChange={setAttSearch}
						searchPlaceholder="Search attendance by employee or date..."
						actions={
							<Button onClick={() => setShowClockModal(true)}>
								+ Log Attendance
							</Button>
						}
						emptyTitle="No attendance records"
						emptyDescription="No attendance logged yet."
						emptyActionText="+ Log Attendance"
						onEmptyAction={() => setShowClockModal(true)}
					/>
				</div>
			)}

			{activeTab === 'payroll' && (
				<div className="card" style={{ padding: '1.25rem' }}>
					<DataTable
						columns={payrollColumns}
						data={filteredPayroll}
						loading={loading}
						searchQuery={paySearch}
						onSearchChange={setPaySearch}
						searchPlaceholder="Search payroll runs by staff name or month..."
						actions={
							<Button onClick={() => setShowPayrollModal(true)}>
								+ Run Monthly Payroll
							</Button>
						}
						emptyTitle="No payroll records"
						emptyDescription="No payroll runs recorded yet."
						emptyActionText="+ Run Monthly Payroll"
						onEmptyAction={() => setShowPayrollModal(true)}
					/>
				</div>
			)}

			{/* Add Employee Modal */}
			<Modal
				title="Add New Staff Member"
				open={showEmpModal}
				onClose={() => setShowEmpModal(false)}
			>
				<form onSubmit={handleAddEmployee} className="stack">
					<Input
						label="Full Name"
						placeholder="e.g. Kasun Perera"
						required
						value={empForm.name}
						onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
					/>
					<div className="grid grid--2">
						<Input
							label="Operational Role"
							placeholder="e.g. Lead Cashier"
							required
							value={empForm.role}
							onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
						/>
						<div>
							<label className="label">Department</label>
							<select
								className="input"
								value={empForm.department}
								onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
							>
								<option value="Operations">Operations</option>
								<option value="Sales & Service">Sales & Service</option>
								<option value="Kitchen / Culinary">Kitchen / Culinary</option>
								<option value="Logistics">Logistics</option>
								<option value="Finance & Admin">Finance & Admin</option>
							</select>
						</div>
					</div>
					<Input
						label="Base Monthly Salary (Rs.)"
						type="number"
						required
						value={empForm.salaryAmount}
						onChange={(e) => setEmpForm({ ...empForm, salaryAmount: e.target.value })}
					/>
					<div className="grid grid--2">
						<Input
							label="Contact Phone"
							placeholder="07xxxxxxxx"
							value={empForm.phone}
							onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
						/>
						<Input
							label="Email Address"
							type="email"
							placeholder="staff@store.com"
							value={empForm.email}
							onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
						/>
					</div>
					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setShowEmpModal(false)}>
							Cancel
						</Button>
						<Button type="submit">Save Staff Member</Button>
					</div>
				</form>
			</Modal>

			{/* Attendance Clock In Modal */}
			<Modal
				title="Log Daily Attendance"
				open={showClockModal}
				onClose={() => setShowClockModal(false)}
			>
				<form onSubmit={handleRecordAttendance} className="stack">
					<div>
						<label className="label">Select Staff Member</label>
						<select
							className="input"
							value={clockForm.employeeId}
							onChange={(e) => setClockForm({ ...clockForm, employeeId: e.target.value })}
						>
							{employees.map((e) => (
								<option key={e.id} value={e.id}>
									{e.name} ({e.role})
								</option>
							))}
						</select>
					</div>
					<div className="grid grid--2">
						<Input
							label="Attendance Date"
							type="date"
							value={clockForm.date}
							onChange={(e) => setClockForm({ ...clockForm, date: e.target.value })}
						/>
						<Input
							label="Check In Time"
							type="time"
							value={clockForm.checkIn}
							onChange={(e) => setClockForm({ ...clockForm, checkIn: e.target.value })}
						/>
					</div>
					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setShowClockModal(false)}>
							Cancel
						</Button>
						<Button type="submit">Save Attendance</Button>
					</div>
				</form>
			</Modal>

			{/* Run Payroll Modal */}
			<Modal
				title="Generate Monthly Payroll"
				open={showPayrollModal}
				onClose={() => setShowPayrollModal(false)}
			>
				<form onSubmit={handleGeneratePayroll} className="stack">
					<Input
						label="Payroll Period (YYYY-MM)"
						type="month"
						required
						value={payrollForm.monthYear}
						onChange={(e) => setPayrollForm({ ...payrollForm, monthYear: e.target.value })}
					/>
					<div className="grid grid--2">
						<Input
							label="Standard Bonus (Rs.)"
							type="number"
							value={payrollForm.bonus}
							onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
						/>
						<Input
							label="Deductions (Rs.)"
							type="number"
							value={payrollForm.deductions}
							onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
						/>
					</div>
					<div className="row row--space" style={{ marginTop: '1rem' }}>
						<Button type="button" variant="secondary" onClick={() => setShowPayrollModal(false)}>
							Cancel
						</Button>
						<Button type="submit">Process Payroll</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
