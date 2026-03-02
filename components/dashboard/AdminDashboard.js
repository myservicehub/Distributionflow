'use client'

import { useState, useEffect } from 'react'
import KPICard from './KPICard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingDown, 
  Package,
  Users,
  Plus,
  ShoppingCart,
  Warehouse
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Complete business overview and analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Sales Today"
          value={formatCurrency(metrics?.totalSalesToday)}
          icon={DollarSign}
          loading={loading}
          description="Today's revenue"
        />
        <KPICard
          title="Sales This Month"
          value={formatCurrency(metrics?.totalSalesMonth)}
          icon={TrendingDown}
          loading={loading}
          description="Month-to-date"
        />
        <KPICard
          title="Outstanding Debt"
          value={formatCurrency(metrics?.totalDebt)}
          icon={AlertTriangle}
          loading={loading}
          description={`${metrics?.overdueRetailers?.length || 0} retailers overdue`}
        />
        <KPICard
          title="Low Stock Items"
          value={metrics?.lowStockProducts?.length || 0}
          icon={Package}
          loading={loading}
          description="Items need restocking"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/retailers">
                <Users className="h-4 w-4 mr-2" />
                Add Retailer
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/products">
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/inventory">
                <Warehouse className="h-4 w-4 mr-2" />
                Record Stock In
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/staff">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Overdue Retailers */}
        <Card>
          <CardHeader>
            <CardTitle>Overdue Retailers</CardTitle>
            <CardDescription>
              {metrics?.overdueRetailers?.length || 0} retailers with overdue payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : metrics?.overdueRetailers?.length > 0 ? (
              <div className="space-y-2">
                {metrics.overdueRetailers.slice(0, 5).map((retailer) => (
                  <div key={retailer.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{retailer.shop_name}</p>
                      <p className="text-xs text-muted-foreground">{retailer.owner_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{formatCurrency(retailer.current_balance)}</p>
                      <p className="text-xs text-muted-foreground">
                        Limit: {formatCurrency(retailer.credit_limit)}
                      </p>
                    </div>
                  </div>
                ))}
                {metrics.overdueRetailers.length > 5 && (
                  <Button asChild variant="link" className="w-full">
                    <Link href="/dashboard/retailers">
                      View all {metrics.overdueRetailers.length} overdue retailers
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No overdue retailers
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>
              {metrics?.lowStockProducts?.length || 0} products need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : metrics?.lowStockProducts?.length > 0 ? (
              <div className="space-y-2">
                {metrics.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{product.stock_quantity} units</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {product.low_stock_threshold}
                      </p>
                    </div>
                  </div>
                ))}
                {metrics.lowStockProducts.length > 5 && (
                  <Button asChild variant="link" className="w-full">
                    <Link href="/dashboard/products">
                      View all {metrics.lowStockProducts.length} low stock items
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                All products sufficiently stocked
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest order activity across all sales reps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Recent orders will appear here</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/orders">View all orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
