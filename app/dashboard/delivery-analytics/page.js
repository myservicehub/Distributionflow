'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Package, Truck } from 'lucide-react'

export default function DeliveryAnalyticsPage() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d') // 7d, 30d, 90d

  useEffect(() => {
    if (userProfile) {
      loadAnalytics()
    }
  }, [userProfile, timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all orders
      const response = await fetch('/api/orders')
      const ordersData = await response.json()
      
      if (!response.ok) throw new Error(ordersData.error)

      const allOrders = ordersData || []
      
      // Filter by time range
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
      }
      
      const filteredOrders = allOrders.filter(o => 
        !o.is_legacy_order && 
        new Date(o.created_at) >= startDate
      )
      
      setOrders(filteredOrders)
      
      // Calculate statistics
      const completedOrders = filteredOrders.filter(o => o.order_status === 'completed')
      const failedOrders = filteredOrders.filter(o => o.delivery_status === 'failed')
      const inTransitOrders = filteredOrders.filter(o => o.delivery_status === 'out_for_delivery')
      
      // Calculate average delivery time
      const deliveryTimes = completedOrders
        .filter(o => o.confirmed_at && o.delivered_at)
        .map(o => {
          const confirmed = new Date(o.confirmed_at)
          const delivered = new Date(o.delivered_at)
          return (delivered - confirmed) / (1000 * 60 * 60) // hours
        })
      
      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0
      
      // Calculate on-time delivery rate (within 48 hours)
      const onTimeDeliveries = deliveryTimes.filter(t => t <= 48).length
      const onTimeRate = deliveryTimes.length > 0
        ? (onTimeDeliveries / deliveryTimes.length) * 100
        : 0
      
      // Success rate
      const totalDeliveryAttempts = completedOrders.length + failedOrders.length
      const successRate = totalDeliveryAttempts > 0
        ? (completedOrders.length / totalDeliveryAttempts) * 100
        : 0
      
      // Total revenue
      const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      
      // Status breakdown
      const statusBreakdown = {
        preparing: filteredOrders.filter(o => o.delivery_status === 'preparing').length,
        packed: filteredOrders.filter(o => o.delivery_status === 'packed').length,
        out_for_delivery: inTransitOrders.length,
        delivered: completedOrders.length,
        failed: failedOrders.length
      }
      
      setStats({
        totalOrders: filteredOrders.length,
        completedOrders: completedOrders.length,
        failedOrders: failedOrders.length,
        inTransitOrders: inTransitOrders.length,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        totalRevenue,
        statusBreakdown
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'indigo' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold mt-2 text-${color}-600`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}% vs last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const StatusBar = ({ label, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-600">{count} ({Math.round(percentage)}%)</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color}-500 transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  if (!['admin', 'manager'].includes(userProfile?.role)) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators and managers can access analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              subtitle="In selected period"
              icon={Package}
              color="indigo"
            />
            <StatCard
              title="Completed"
              value={stats.completedOrders}
              subtitle={`${stats.successRate}% success rate`}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="In Transit"
              value={stats.inTransitOrders}
              subtitle="Out for delivery"
              icon={Truck}
              color="orange"
            />
            <StatCard
              title="Avg Delivery Time"
              value={`${stats.avgDeliveryTime}h`}
              subtitle={`${stats.onTimeRate}% on-time`}
              icon={Clock}
              color="blue"
            />
          </div>

          {/* Revenue & Performance */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  ₦{stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  From {stats.completedOrders} completed deliveries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">On-Time Delivery Rate</span>
                  <Badge variant={stats.onTimeRate >= 80 ? 'default' : 'destructive'} className="text-sm">
                    {stats.onTimeRate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <Badge variant={stats.successRate >= 90 ? 'default' : 'destructive'} className="text-sm">
                    {stats.successRate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Deliveries</span>
                  <span className="text-sm text-red-600 font-semibold">{stats.failedOrders}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBar
                label="Preparing"
                count={stats.statusBreakdown.preparing}
                total={stats.totalOrders}
                color="blue"
              />
              <StatusBar
                label="Packed"
                count={stats.statusBreakdown.packed}
                total={stats.totalOrders}
                color="purple"
              />
              <StatusBar
                label="Out for Delivery"
                count={stats.statusBreakdown.out_for_delivery}
                total={stats.totalOrders}
                color="orange"
              />
              <StatusBar
                label="Delivered"
                count={stats.statusBreakdown.delivered}
                total={stats.totalOrders}
                color="green"
              />
              <StatusBar
                label="Failed"
                count={stats.statusBreakdown.failed}
                total={stats.totalOrders}
                color="red"
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
