const crypto = require('crypto')

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`
}

// In-memory store (replace with a DB later)
const store = {
  users: [
    {
      id: 'u_admin',
      name: 'Demo Admin',
      email: 'admin@example.com',
      role: 'admin',
      password: 'admin',
    },
  ],
  categories: [
    { id: 'c_general', name: 'General' },
    { id: 'c_bev', name: 'Beverages' },
  ],
  products: [
    { id: 'p_item_a', name: 'Item A', price: 250, sku: 'A-001', stock: 20, categoryId: 'c_general' },
    { id: 'p_item_b', name: 'Item B', price: 450, sku: 'B-001', stock: 12, categoryId: 'c_bev' },
    { id: 'p_item_c', name: 'Item C', price: 120, sku: 'C-001', stock: 35, categoryId: 'c_general' },
  ],
  customers: [],
  sales: [],
  purchases: [],
  expenses: [],
  settings: { currency: 'LKR', taxRate: 0 },
}

module.exports = { store, id }
