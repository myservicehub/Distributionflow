'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, AlertTriangle, Package } from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
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
      setMetrics(data)
    } catch (error) {
      toast.error('Failed to load dashboard metrics')
      console.error(error)
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Overview of your distribution business</p>
      </div>

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
    </div>
  )
}
