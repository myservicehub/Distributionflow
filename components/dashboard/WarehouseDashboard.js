'use client'

import { useState, useEffect } from 'react'
import KPICard from './KPICard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package,
  TrendingUp,
  TrendingDown,
  Truck,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export default function WarehouseDashboard() {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Warehouse Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Inventory management and dispatch operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Stock In Today"
          value="0"
          icon={TrendingUp}
          loading={loading}
          description="Items received"
        />
        <KPICard
          title="Stock Out Today"
          value="0"
          icon={TrendingDown}
          loading={loading}
          description="Items dispatched"
        />
        <KPICard
          title="Low Stock Products"
          value={metrics?.lowStockProducts?.length || 0}
          icon={Package}
          loading={loading}
          description="Need restocking"
        />
        <KPICard
          title="Pending Deliveries"
          value="0"
          icon={Truck}
          loading={loading}
          description="Ready to dispatch"
        />
      </div>

      {/* Orders Ready for Dispatch */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Ready for Dispatch</CardTitle>
          <CardDescription>
            Confirmed orders awaiting delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No orders ready for dispatch</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/orders">View all orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
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
              {metrics.lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {product.stock_quantity} units
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Min: {product.low_stock_threshold}
                    </p>
                  </div>
                </div>
              ))}
              <Button asChild variant="link" className="w-full">
                <Link href="/dashboard/inventory">View inventory</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>All products sufficiently stocked</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
          <CardDescription>Latest inventory transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Recent stock movements will appear here</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/inventory">View inventory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
