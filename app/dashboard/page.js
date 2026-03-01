'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, AlertTriangle, Package, ShoppingCart, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics')
      if (!response.ok) throw new Error('Failed to load metrics')
      const data = await response.json()
      console.log('Dashboard metrics loaded:', data)
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error)
      alert('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Role-specific dashboard rendering
  const role = userProfile?.role
  
  console.log('User profile:', userProfile)
  console.log('User role:', role)
  console.log('Metrics:', metrics)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back, {userProfile?.name}!
        </h2>
        <p className="text-gray-600 mt-2">
          {role === 'admin' && 'Complete overview of your distribution business'}
          {role === 'manager' && 'Manage operations and monitor performance'}
          {role === 'sales_rep' && 'Track your sales and manage customers'}
          {role === 'warehouse' && 'Monitor inventory and stock levels'}
        </p>
      </div>

      {/* Admin Dashboard */}
      {role === 'admin' && (
        <AdminDashboard metrics={metrics} />
      )}

      {/* Manager Dashboard */}
      {role === 'manager' && (
        <ManagerDashboard metrics={metrics} />
      )}

      {/* Sales Rep Dashboard */}
      {role === 'sales_rep' && (
        <SalesRepDashboard metrics={metrics} />
      )}

      {/* Warehouse Dashboard */}
      {role === 'warehouse' && (
        <WarehouseDashboard metrics={metrics} />
      )}
    </div>
  )
}

// Admin Dashboard - Full overview
function AdminDashboard({ metrics }) {
  return (
    <>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sales Today</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.totalSalesToday?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sales This Month</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.totalSalesMonth?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Outstanding Debt</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.totalDebt?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
            <Package className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.lowStockProducts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Retailers */}
        <Card>
          <CardHeader>
            <CardTitle>Overdue Retailers</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.overdueRetailers?.length > 0 ? (
              <div className="space-y-3">
                {metrics.overdueRetailers.slice(0, 5).map((retailer) => (
                  <div key={retailer.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{retailer.shop_name}</p>
                      <p className="text-sm text-gray-600">Limit: ₦{retailer.credit_limit?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">₦{retailer.current_balance?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Overdue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No overdue retailers</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.lowStockProducts?.length > 0 ? (
              <div className="space-y-3">
                {metrics.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">Threshold: {product.low_stock_threshold}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{product.stock_quantity} units</p>
                      <p className="text-xs text-gray-500">Low stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">All products adequately stocked</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Rep */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Representative</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.salesByRep?.length > 0 ? (
            <div className="space-y-3">
              {metrics.salesByRep.map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{rep.name}</p>
                  <p className="font-semibold text-indigo-600">₦{rep.total?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sales data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full">
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </Link>
            <Link href="/dashboard/retailers">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Add Retailer
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </Link>
            <Link href="/dashboard/activity-log">
              <Button variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                View Activity
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Manager Dashboard - Operations focus
function ManagerDashboard({ metrics }) {
  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Sales</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.totalSalesToday?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Track daily performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding Debt</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.totalDebt?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Monitor collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
            <Package className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.lowStockProducts?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Restock needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Priority Retailers</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.overdueRetailers?.length > 0 ? (
              <div className="space-y-3">
                {metrics.overdueRetailers.slice(0, 5).map((retailer) => (
                  <div key={retailer.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{retailer.shop_name}</p>
                      <p className="text-sm text-gray-600">Action required</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">₦{retailer.current_balance?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">All retailers up to date</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.lowStockProducts?.length > 0 ? (
              <div className="space-y-3">
                {metrics.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="font-semibold text-orange-600">{product.stock_quantity} units</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Stock levels healthy</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.salesByRep?.length > 0 ? (
            <div className="space-y-3">
              {metrics.salesByRep.map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{rep.name}</p>
                    <p className="text-sm text-gray-600">Sales Representative</p>
                  </div>
                  <p className="font-semibold text-indigo-600">₦{rep.total?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Process Order
              </Button>
            </Link>
            <Link href="/dashboard/retailers">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Manage Retailers
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Sales Rep Dashboard - Sales focused
function SalesRepDashboard({ metrics }) {
  return (
    <>
      {/* My Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">My Sales Today</CardTitle>
            <DollarSign className="h-5 w-5 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">₦{metrics?.totalSalesToday?.toLocaleString() || 0}</div>
            <p className="text-xs text-green-700 mt-1">Keep up the great work!</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">This Month</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">₦{metrics?.totalSalesMonth?.toLocaleString() || 0}</div>
            <p className="text-xs text-blue-700 mt-1">Monthly target progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">My Customers</CardTitle>
            <Users className="h-5 w-5 text-purple-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{metrics?.totalRetailers || 0}</div>
            <p className="text-xs text-purple-700 mt-1">Active retailers</p>
          </CardContent>
        </Card>
      </div>

      {/* My Customers */}
      <Card>
        <CardHeader>
          <CardTitle>My Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.overdueRetailers?.length > 0 ? (
            <div className="space-y-3">
              {metrics.overdueRetailers.slice(0, 5).map((retailer) => (
                <div key={retailer.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{retailer.shop_name}</p>
                    <p className="text-sm text-gray-600">Contact: {retailer.contact_person || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₦{retailer.current_balance?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Outstanding</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No customer data yet</p>
              <Link href="/dashboard/retailers">
                <Button className="mt-4">Add Your First Customer</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/orders">
              <Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <ShoppingCart className="h-8 w-8" />
                <span>Create Order</span>
              </Button>
            </Link>
            <Link href="/dashboard/retailers">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Users className="h-8 w-8" />
                <span>Add Customer</span>
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <DollarSign className="h-8 w-8" />
                <span>Record Payment</span>
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-8 w-8" />
                <span>My Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Warehouse Dashboard - Inventory focused
function WarehouseDashboard({ metrics }) {
  return (
    <>
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">{metrics?.lowStockProducts?.length || 0}</div>
            <p className="text-xs text-orange-700 mt-1">Items need restocking</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Products</CardTitle>
            <Package className="h-5 w-5 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{metrics?.totalProducts || 0}</div>
            <p className="text-xs text-blue-700 mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Orders Today</CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{metrics?.ordersToday || 0}</div>
            <p className="text-xs text-green-700 mt-1">To be fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Critical Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.lowStockProducts?.length > 0 ? (
            <div className="space-y-3">
              {metrics.lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</p>
                    <p className="text-xs text-orange-600 mt-1">Threshold: {product.low_stock_threshold} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-700">{product.stock_quantity}</p>
                    <p className="text-xs text-gray-500">units left</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">All stock levels are healthy</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/dashboard/products">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Package className="h-6 w-6" />
                <span>View Inventory</span>
              </Button>
            </Link>
            <Link href="/dashboard/products">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Add Stock</span>
              </Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span>View Orders</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
