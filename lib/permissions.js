// Permission utility for role-based access control

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS = {
  admin: {
    staff: ['view', 'create', 'edit', 'delete'],
    retailers: ['view', 'create', 'edit', 'delete'],
    products: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    payments: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'export'],
    settings: ['view', 'edit'],
    stock_movements: ['view', 'create'],
    audit_logs: ['view']
  },
  manager: {
    staff: ['view'],
    retailers: ['view', 'create', 'edit'],
    products: ['view', 'create', 'edit'],
    orders: ['view', 'edit'],
    payments: ['view', 'create', 'edit'],
    reports: ['view', 'export'],
    settings: [],
    stock_movements: ['view', 'create'],
    audit_logs: []
  },
  sales_rep: {
    staff: [],
    retailers: ['view', 'create', 'edit'],
    products: ['view'],
    orders: ['view', 'create', 'edit'],
    payments: ['view', 'create'],
    reports: ['view'],
    settings: [],
    stock_movements: ['view'],
    audit_logs: []
  },
  warehouse: {
    staff: [],
    retailers: ['view'],
    products: ['view', 'create', 'edit'],
    orders: ['view'],
    payments: [],
    reports: ['view'],
    settings: [],
    stock_movements: ['view', 'create'],
    audit_logs: []
  }
}

/**
 * Check if a user has permission to perform an action
 * @param {Object} user - User object with role property
 * @param {string} action - Action to check (e.g., 'create', 'edit', 'delete')
 * @param {string} resource - Resource type (e.g., 'staff', 'retailers', 'products')
 * @returns {boolean} - True if user has permission
 */
export function can(user, action, resource) {
  if (!user || !user.role) return false
  
  const role = user.role.toLowerCase()
  const permissions = PERMISSIONS[role]
  
  if (!permissions) return false
  if (!permissions[resource]) return false
  
  return permissions[resource].includes(action)
}

/**
 * Check if user has any permissions for a resource
 * @param {Object} user - User object with role property
 * @param {string} resource - Resource type
 * @returns {boolean} - True if user has any permission for the resource
 */
export function canAccess(user, resource) {
  if (!user || !user.role) return false
  
  const role = user.role.toLowerCase()
  const permissions = PERMISSIONS[role]
  
  if (!permissions) return false
  if (!permissions[resource]) return false
  
  return permissions[resource].length > 0
}

/**
 * Get all permissions for a user's role
 * @param {Object} user - User object with role property
 * @returns {Object} - Permission matrix for the user's role
 */
export function getUserPermissions(user) {
  if (!user || !user.role) return {}
  
  const role = user.role.toLowerCase()
  return PERMISSIONS[role] || {}
}

/**
 * Check if user is admin
 * @param {Object} user - User object with role property
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user && user.role === 'admin'
}

/**
 * Check if user is manager or admin
 * @param {Object} user - User object with role property
 * @returns {boolean}
 */
export function isManagerOrAdmin(user) {
  return user && (user.role === 'admin' || user.role === 'manager')
}

export { PERMISSIONS }

// ============================================
// NAVIGATION ITEMS BY ROLE
// ============================================

export const NAVIGATION_ITEMS = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Retailers', href: '/dashboard/retailers', icon: 'Store' },
    { name: 'Products', href: '/dashboard/products', icon: 'Package' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: 'Warehouse' },
    { name: 'Orders', href: '/dashboard/orders', icon: 'ShoppingCart' },
    { name: 'Payments', href: '/dashboard/payments', icon: 'CreditCard' },
    { name: 'Reports', href: '/dashboard/reports', icon: 'BarChart3' },
    { name: 'Staff', href: '/dashboard/staff', icon: 'Users' },
    { name: 'Activity Log', href: '/dashboard/activity-log', icon: 'FileText' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' }
  ],
  manager: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Retailers', href: '/dashboard/retailers', icon: 'Store' },
    { name: 'Products', href: '/dashboard/products', icon: 'Package' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: 'Warehouse' },
    { name: 'Orders', href: '/dashboard/orders', icon: 'ShoppingCart' },
    { name: 'Payments', href: '/dashboard/payments', icon: 'CreditCard' },
    { name: 'Reports', href: '/dashboard/reports', icon: 'BarChart3' }
  ],
  sales_rep: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'My Retailers', href: '/dashboard/retailers', icon: 'Store' },
    { name: 'Orders', href: '/dashboard/orders', icon: 'ShoppingCart' },
    { name: 'Payments', href: '/dashboard/payments', icon: 'CreditCard' }
  ],
  warehouse: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: 'Warehouse' },
    { name: 'Dispatch', href: '/dashboard/dispatch', icon: 'Truck' }
  ]
}

/**
 * Get navigation items for a user's role
 * @param {Object} user - User object with role property
 * @returns {Array} - Array of navigation items
 */
export function getNavigationItems(user) {
  if (!user || !user.role) return []
  return NAVIGATION_ITEMS[user.role] || []
}

// ============================================
// BUSINESS RULE CHECKS
// ============================================

/**
 * Check if retailer is blocked due to credit limit
 */
export function isRetailerBlocked(retailer) {
  return retailer.current_balance > retailer.credit_limit
}

/**
 * Check if retailer can place an order
 */
export function canPlaceOrder(retailer) {
  return !isRetailerBlocked(retailer)
}

/**
 * Check if product has low stock
 */
export function hasLowStock(product) {
  return product.stock_quantity <= product.low_stock_threshold
}

/**
 * Check if there's enough stock to fulfill order
 */
export function canFulfillOrder(orderItems, products) {
  return orderItems.every(item => {
    const product = products.find(p => p.id === item.product_id)
    return product && product.stock_quantity >= item.quantity
  })
}
