const { store, id } = require('../data/store')

async function list() {
	return store.customers
}

async function create(payload) {
	const customer = {
		id: id('cu'),
		name: payload.name,
		phone: payload.phone || '',
		email: payload.email || '',
	}
	store.customers.unshift(customer)
	return customer
}

async function update(customerId, payload) {
	const customer = store.customers.find((c) => c.id === customerId)
	if (!customer) {
		const err = new Error('Customer not found')
		err.status = 404
		throw err
	}
	if (payload.name !== undefined) customer.name = payload.name
	if (payload.phone !== undefined) customer.phone = payload.phone
	if (payload.email !== undefined) customer.email = payload.email
	return customer
}

async function remove(customerId) {
	const before = store.customers.length
	store.customers = store.customers.filter((c) => c.id !== customerId)
	return store.customers.length !== before
}

module.exports = { list, create, update, remove }
