const { store, id } = require('../data/store')

async function listUsers(req, res) {
	res.json(store.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })))
}

async function createUser(req, res) {
	const payload = req.body || {}
	const user = {
		id: id('u'),
		name: payload.name,
		email: payload.email,
		role: payload.role || 'cashier',
		password: payload.password || 'password',
	}
	store.users.push(user)
	res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
}

async function updateUser(req, res) {
	const user = store.users.find((u) => u.id === req.params.id)
	if (!user) return res.status(404).json({ message: 'User not found' })
	if (req.body?.name !== undefined) user.name = req.body.name
	if (req.body?.email !== undefined) user.email = req.body.email
	if (req.body?.role !== undefined) user.role = req.body.role
	res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
}

async function deleteUser(req, res) {
	const before = store.users.length
	store.users = store.users.filter((u) => u.id !== req.params.id)
	res.json({ ok: store.users.length !== before })
}

module.exports = { listUsers, createUser, updateUser, deleteUser }
