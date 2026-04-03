const { store } = require('../data/store')

async function getSettings(req, res) {
	res.json(store.settings)
}

async function updateSettings(req, res) {
	store.settings = { ...store.settings, ...(req.body || {}) }
	res.json(store.settings)
}

module.exports = { getSettings, updateSettings }
