/**
 * Universal SaaS POS + ERP — Master Feature Registry & Industry Presets
 */

const FEATURE_CATEGORIES = {
	POS: 'Point of Sale',
	INVENTORY: 'Inventory & Stock',
	SALES: 'Sales & Invoicing',
	PROCUREMENT: 'Purchasing & Suppliers',
	FINANCE: 'Finance & Accounting',
	RESTAURANT: 'Restaurant & Hospitality',
	SERVICES: 'Service Center & Repairs',
	SALON: 'Salon & Appointments',
	PHARMACY: 'Pharmacy & Healthcare',
	WHOLESALE: 'Wholesale & B2B',
	HRM: 'HRM & Payroll',
	PLATFORM: 'Platform & Integrations',
}

const FEATURE_DEFINITIONS = [
	// POS
	{
		key: 'pos.core',
		name: 'POS Terminal Core',
		category: FEATURE_CATEGORIES.POS,
		description: 'Standard cash register checkout, cart, barcode scanner, and receipts.',
		defaultIn: ['starter', 'pro', 'enterprise'],
		dependencies: [],
	},
	{
		key: 'pos.returns',
		name: 'Returns & Refunds',
		category: FEATURE_CATEGORIES.POS,
		description: 'Process customer returns, refunds, and restock returned items.',
		defaultIn: ['pro', 'enterprise'],
		dependencies: ['pos.core'],
	},
	{
		key: 'pos.splitPayments',
		name: 'Split & Mixed Payments',
		category: FEATURE_CATEGORIES.POS,
		description: 'Allow split payments across cash, card, and bank transfers.',
		defaultIn: ['starter', 'pro', 'enterprise'],
		dependencies: ['pos.core'],
	},
	{
		key: 'pos.holdResume',
		name: 'Hold & Resume Transactions',
		category: FEATURE_CATEGORIES.POS,
		description: 'Park customer carts and resume later without losing active order items.',
		defaultIn: ['starter', 'pro', 'enterprise'],
		dependencies: ['pos.core'],
	},

	// INVENTORY
	{
		key: 'inventory.core',
		name: 'Product & Stock Management',
		category: FEATURE_CATEGORIES.INVENTORY,
		description: 'Product catalog, categories, pricing, and stock balance adjustments.',
		defaultIn: ['starter', 'pro', 'enterprise'],
		dependencies: [],
	},
	{
		key: 'inventory.batchTracking',
		name: 'Batch & Expiry Tracking',
		category: FEATURE_CATEGORIES.INVENTORY,
		description: 'Track manufacturing batches, expiration dates, and lot numbers.',
		defaultIn: ['enterprise'],
		dependencies: ['inventory.core'],
	},
	{
		key: 'inventory.multiWarehouse',
		name: 'Multi-Warehouse & Locations',
		category: FEATURE_CATEGORIES.INVENTORY,
		description: 'Manage distinct warehouses, stock transfers, and branch inventory.',
		defaultIn: ['enterprise'],
		dependencies: ['inventory.core'],
	},

	// SALES
	{
		key: 'sales.history',
		name: 'Sales History & Invoicing',
		category: FEATURE_CATEGORIES.SALES,
		description: 'Searchable sales ledger, A4 invoice printing, and transaction inspection.',
		defaultIn: ['starter', 'pro', 'enterprise'],
		dependencies: ['pos.core'],
	},
	{
		key: 'sales.creditSales',
		name: 'Customer Credit & Accounts',
		category: FEATURE_CATEGORIES.SALES,
		description: 'Allow on-credit sales with customer credit limits and balance statements.',
		defaultIn: ['pro', 'enterprise'],
		dependencies: ['sales.history'],
	},

	// PROCUREMENT
	{
		key: 'purchases.core',
		name: 'Purchasing & Suppliers (GRN)',
		category: FEATURE_CATEGORIES.PROCUREMENT,
		description: 'Supplier directory, purchase orders, and goods received note restock.',
		defaultIn: ['pro', 'enterprise'],
		dependencies: ['inventory.core'],
	},

	// FINANCE
	{
		key: 'finance.expenses',
		name: 'Expense Tracking',
		category: FEATURE_CATEGORIES.FINANCE,
		description: 'Record operating overhead, utility payments, and petty cash outflows.',
		defaultIn: ['pro', 'enterprise'],
		dependencies: [],
	},
	{
		key: 'finance.accounting',
		name: 'Double-Entry Accounting & Ledger',
		category: FEATURE_CATEGORIES.FINANCE,
		description: 'Chart of accounts, general ledger, trial balance, and balance sheets.',
		defaultIn: ['enterprise'],
		dependencies: ['finance.expenses'],
	},

	// REPORTS
	{
		key: 'reports.advanced',
		name: 'Reporting & Analytics',
		category: FEATURE_CATEGORIES.FINANCE,
		description: 'Comprehensive revenue, profit/loss, tax breakdown, and product ranking reports.',
		defaultIn: ['pro', 'enterprise'],
		dependencies: [],
	},

	// RESTAURANT
	{
		key: 'restaurant.core',
		name: 'Restaurant & Table Management',
		category: FEATURE_CATEGORIES.RESTAURANT,
		description: 'Floor layouts, dining table occupancy, and waiter order management.',
		defaultIn: ['enterprise'],
		dependencies: ['pos.core'],
	},
	{
		key: 'restaurant.kitchenDisplay',
		name: 'Kitchen Display System (KDS)',
		category: FEATURE_CATEGORIES.RESTAURANT,
		description: 'Live order board for kitchen staff with real-time status updates.',
		defaultIn: ['enterprise'],
		dependencies: ['restaurant.core'],
	},

	// SERVICE CENTER
	{
		key: 'repairs.jobCards',
		name: 'Repair Management & Job Cards',
		category: FEATURE_CATEGORIES.SERVICES,
		description: 'Device tracking, diagnostics, repair progress, technician assignment, and spare parts.',
		defaultIn: ['enterprise'],
		dependencies: ['inventory.core'],
	},

	// SALON
	{
		key: 'salon.appointments',
		name: 'Salon Appointments & Stylists',
		category: FEATURE_CATEGORIES.SALON,
		description: 'Appointment booking calendar, stylist schedules, and service catalog.',
		defaultIn: ['enterprise'],
		dependencies: ['pos.core'],
	},

	// PHARMACY
	{
		key: 'pharmacy.core',
		name: 'Pharmacy Prescription & Batch Recall',
		category: FEATURE_CATEGORIES.PHARMACY,
		description: 'Prescription verification, medicine expiry alerts, and batch recall compliance.',
		defaultIn: ['enterprise'],
		dependencies: ['inventory.batchTracking'],
	},

	// WHOLESALE
	{
		key: 'wholesale.pricing',
		name: 'Wholesale Tiered Pricing & MOQs',
		category: FEATURE_CATEGORIES.WHOLESALE,
		description: 'Volume discount tiers, minimum order quantities, and B2B pricing sheets.',
		defaultIn: ['enterprise'],
		dependencies: ['sales.history'],
	},

	// HRM
	{
		key: 'hrm.core',
		name: 'HRM & Employee Attendance',
		category: FEATURE_CATEGORIES.HRM,
		description: 'Staff directory, department assignments, shift schedules, and attendance logs.',
		defaultIn: ['enterprise'],
		dependencies: [],
	},
	{
		key: 'hrm.payroll',
		name: 'Payroll & Salary Slips',
		category: FEATURE_CATEGORIES.HRM,
		description: 'Salary structures, monthly payroll processing, allowances, and pay slips.',
		defaultIn: ['enterprise'],
		dependencies: ['hrm.core'],
	},
]

// Legacy aliases for backward compatibility
const LEGACY_FEATURE_MAP = {
	inventoryManagement: 'inventory.core',
	purchaseManagement: 'purchases.core',
	expenseManagement: 'finance.expenses',
	reports: 'reports.advanced',
	erpCore: 'finance.accounting',
	procurement: 'purchases.core',
	accounting: 'finance.accounting',
	hrm: 'hrm.core',
}

// Industry Presets
const INDUSTRY_PRESETS = {
	retail: {
		name: 'Retail Shop / Boutique',
		description: 'Standard retail store with POS billing, inventory, and sales history.',
		recommendedFeatures: [
			'pos.core',
			'pos.returns',
			'pos.splitPayments',
			'pos.holdResume',
			'inventory.core',
			'sales.history',
			'purchases.core',
			'finance.expenses',
			'reports.advanced',
		],
	},
	supermarket: {
		name: 'Supermarket / Grocery',
		description: 'High-throughput supermarket with barcode scanner, fast billing, and batch tracking.',
		recommendedFeatures: [
			'pos.core',
			'pos.returns',
			'pos.splitPayments',
			'pos.holdResume',
			'inventory.core',
			'inventory.batchTracking',
			'sales.history',
			'purchases.core',
			'finance.expenses',
			'reports.advanced',
		],
	},
	restaurant: {
		name: 'Restaurant / Café / Bar',
		description: 'Dining hospitality with table management, kitchen tickets, and split bills.',
		recommendedFeatures: [
			'pos.core',
			'pos.splitPayments',
			'pos.holdResume',
			'inventory.core',
			'sales.history',
			'purchases.core',
			'finance.expenses',
			'reports.advanced',
			'restaurant.core',
			'restaurant.kitchenDisplay',
		],
	},
	pharmacy: {
		name: 'Pharmacy / Drugstore',
		description: 'Batch and expiry date tracking with medicine catalog and prescription flags.',
		recommendedFeatures: [
			'pos.core',
			'pos.returns',
			'pos.splitPayments',
			'inventory.core',
			'inventory.batchTracking',
			'pharmacy.core',
			'sales.history',
			'purchases.core',
			'finance.expenses',
			'reports.advanced',
		],
	},
	service_center: {
		name: 'Service Center / Electronics Repair',
		description: 'Job card creation, device intake, repair progress, and spare parts.',
		recommendedFeatures: [
			'pos.core',
			'pos.splitPayments',
			'inventory.core',
			'repairs.jobCards',
			'sales.history',
			'purchases.core',
			'finance.expenses',
			'reports.advanced',
		],
	},
	salon: {
		name: 'Salon / Spa / Wellness',
		description: 'Appointment booking, stylist assignments, and service checkout.',
		recommendedFeatures: [
			'pos.core',
			'pos.splitPayments',
			'inventory.core',
			'salon.appointments',
			'sales.history',
			'finance.expenses',
			'reports.advanced',
		],
	},
	wholesale: {
		name: 'Wholesale / Distribution Enterprise',
		description: 'B2B distributor with customer credit, tiered prices, and multi-warehouse.',
		recommendedFeatures: [
			'pos.core',
			'inventory.core',
			'inventory.multiWarehouse',
			'sales.history',
			'sales.creditSales',
			'wholesale.pricing',
			'purchases.core',
			'finance.expenses',
			'finance.accounting',
			'reports.advanced',
			'hrm.core',
		],
	},
}

module.exports = {
	FEATURE_CATEGORIES,
	FEATURE_DEFINITIONS,
	LEGACY_FEATURE_MAP,
	INDUSTRY_PRESETS,
}

