function logger(...args) {
	// Simple wrapper so it can be swapped later
	// eslint-disable-next-line no-console
	console.log(...args)
}

module.exports = logger
