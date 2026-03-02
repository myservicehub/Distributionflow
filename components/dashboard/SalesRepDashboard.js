'use client'

import { useState, useEffect } from 'react'
import KPICard from './KPICard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  Target,
  AlertTriangle,
  TrendingUp,
  Users,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function SalesRepDashboard() {
  const { userProfile } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [myRetailers, setMyRetailers] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch metrics
      const metricsRes = await fetch('/api/dashboard/metrics')
      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data)
      }

      // Fetch my retailers
      const retailersRes = await fetch('/api/retailers')
      if (retailersRes.ok) {
        const data = await retailersRes.json()
        setMyRetailers(data)
      }

      // Fetch my orders
      const ordersRes = await fetch('/api/orders')
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setMyOrders(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

  // Calculate my sales today
  const mySalesToday = myOrders
    .filter(order => {
      const orderDate = new Date(order.created_at)
      const today = new Date()
      return orderDate.toDateString() === today.toDateString()
    })
    .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)

  // Calculate my outstanding debt
  const myOutstandingDebt = myRetailers
    .reduce((sum, retailer) => sum + (parseFloat(retailer.current_balance) || 0), 0)

  // Overdue retailers
  const myOverdueRetailers = myRetailers
    .filter(r => parseFloat(r.current_balance) > parseFloat(r.credit_limit))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Performance</h1>
        <p className="text-muted-foreground mt-1">
          Your personal sales dashboard and assigned retailers
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="My Sales Today"
          value={formatCurrency(mySalesToday)}
          icon={DollarSign}
          loading={loading}
          description="Revenue today"
        />
        <KPICard
          title="My Collections Today"
          value={formatCurrency(0)}
          icon={TrendingUp}
          loading={loading}
          description="Payments received"
        />
        <KPICard
          title="My Outstanding Debt"
          value={formatCurrency(myOutstandingDebt)}
          icon={AlertTriangle}
          loading={loading}
          description={`${myOverdueRetailers.length} overdue`}
        />
        <KPICard
          title="Monthly Target"
          value="0%"
          icon={Target}
          loading={loading}
          description="Progress this month"
        />
      </div>

      {/* My Assigned Retailers */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Retailers</CardTitle>
          <CardDescription>
            {myRetailers.length} retailers under your management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : myRetailers.length > 0 ? (
            <div className="space-y-2">
              {myRetailers.slice(0, 5).map((retailer) => (
                <div key={retailer.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{retailer.shop_name}</p>
                      <p className="text-sm text-muted-foreground">{retailer.owner_name}</p>
                      <p className="text-xs text-muted-foreground">{retailer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      parseFloat(retailer.current_balance) > parseFloat(retailer.credit_limit)
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {formatCurrency(retailer.current_balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Limit: {formatCurrency(retailer.credit_limit)}
                    </p>
                  </div>
                </div>
              ))}
              {myRetailers.length > 5 && (
                <Button asChild variant="link" className="w-full">
                  <Link href="/dashboard/retailers">
                    View all {myRetailers.length} retailers
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No retailers assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Orders</CardTitle>
          <CardDescription>Latest orders you've created</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : myOrders.length > 0 ? (
            <div className="space-y-2">
              {myOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              <Button asChild variant="link" className="w-full">
                <Link href="/dashboard/orders">View all orders</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No orders yet</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/orders">Create first order</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Retailers Alert */}
      {myOverdueRetailers.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ Retailers Needing Attention</CardTitle>
            <CardDescription>
              {myOverdueRetailers.length} retailers have exceeded their credit limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myOverdueRetailers.map((retailer) => (
                <div key={retailer.id} className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-sm">{retailer.shop_name}</p>
                  <p className="font-semibold text-red-600">{formatCurrency(retailer.current_balance)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
