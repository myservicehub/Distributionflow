'use client'

import { useState, useEffect } from 'react'
import KPICard from './KPICard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  AlertTriangle, 
  Clock,
  Package,
  CheckCircle,
  Truck
} from 'lucide-react'
import Link from 'next/link'

export default function ManagerDashboard() {
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
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Operational overview and pending tasks
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Sales Today"
          value={formatCurrency(metrics?.totalSalesToday)}
          icon={DollarSign}
          loading={loading}
          description="Revenue generated today"
        />
        <KPICard
          title="Pending Orders"
          value="0"
          icon={Clock}
          loading={loading}
          description="Awaiting confirmation"
        />
        <KPICard
          title="Pending Deliveries"
          value="0"
          icon={Truck}
          loading={loading}
          description="Ready to dispatch"
        />
        <KPICard
          title="Low Stock Alerts"
          value={metrics?.lowStockProducts?.length || 0}
          icon={Package}
          loading={loading}
          description="Items need attention"
        />
      </div>

      {/* Action Required Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders Awaiting Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Awaiting Confirmation</CardTitle>
            <CardDescription>
              Review and approve pending orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending orders</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/orders">View all orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Retailers Near Credit Limit */}
        <Card>
          <CardHeader>
            <CardTitle>Retailers Near Credit Limit</CardTitle>
            <CardDescription>
              {metrics?.overdueRetailers?.length || 0} retailers approaching limit
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
                      <p className="font-semibold text-orange-600">{formatCurrency(retailer.current_balance)}</p>
                      <p className="text-xs text-muted-foreground">
                        / {formatCurrency(retailer.credit_limit)}
                      </p>
                    </div>
                  </div>
                ))}
                <Button asChild variant="link" className="w-full">
                  <Link href="/dashboard/retailers">View all retailers</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                All retailers within credit limits
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
          <CardDescription>Latest inventory changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Recent stock movements will appear here</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/inventory">View inventory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Sales per Rep</CardTitle>
          <CardDescription>Team performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sales performance data will appear here</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/reports">View reports</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
