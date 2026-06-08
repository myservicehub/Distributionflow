'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown, 
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllActivities, setShowAllActivities] = useState(false)

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

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInSeconds = Math.floor((now - past) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return past.toLocaleDateString()
  }

  // Modern KPI Card Component - Mobile Optimized
  const ModernKPICard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", loading }) => {
    const colorClasses = {
      blue: {
        bg: "bg-emerald-50",
        icon: "bg-emerald-100",
        iconColor: "text-emerald-600",
        text: "text-emerald-700"
      },
      green: {
        bg: "bg-success-50",
        icon: "bg-success-100",
        iconColor: "text-success-600",
        text: "text-success-700"
      },
      orange: {
        bg: "bg-orange-50",
        icon: "bg-orange-100",
        iconColor: "text-orange-600",
        text: "text-orange-700"
      },
      purple: {
        bg: "bg-purple-50",
        icon: "bg-purple-100",
        iconColor: "text-purple-600",
        text: "text-purple-700"
      }
    }

    const colorScheme = colorClasses[color]

    return (
      <Card className={`${colorScheme.bg} border-2 border-neutral-200 shadow-md hover:shadow-lg transition-all duration-300`}>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-neutral-200 rounded animate-shimmer w-24"></div>
              <div className="h-8 bg-neutral-200 rounded animate-shimmer w-32"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-600">{title}</p>
                <div className={`p-2.5 rounded-full ${colorScheme.icon}`}>
                  <Icon className={`h-5 w-5 ${colorScheme.iconColor}`} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-neutral-900 break-all">{value}</p>
                {trend && trendValue && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    trend === 'up' ? 'text-success-600' : 'text-red-600'
                  }`}>
                    {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{trendValue}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Quick Action Button - Mobile Optimized
  const QuickActionBtn = ({ href, icon: Icon, label, variant = "outline" }) => (
    <Link href={href}>
      <Button 
        variant={variant}
        className="w-full h-auto py-3 px-4 justify-start gap-3 hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
      >
        <div className="p-2 rounded-lg bg-emerald-100">
          <Icon className="h-4 w-4 text-emerald-600" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </Button>
    </Link>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Modern Header */}
        <div className="animate-slide-down">
          <div className="flex items-center gap-2 text-emerald-600 text-xs sm:text-sm font-medium mb-2">
            <Activity className="h-4 w-4" />
            <span>DASHBOARD OVERVIEW</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-neutral-600 mt-2 text-base sm:text-lg">
            Here's what's happening with your business today
          </p>
        </div>

        {/* KPI Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          <ModernKPICard
            title="Today's Sales"
            value={formatCurrency(metrics?.totalSalesToday)}
            icon={DollarSign}
            color="blue"
            loading={loading}
          />
          <ModernKPICard
            title="Monthly Revenue"
            value={formatCurrency(metrics?.totalSalesMonth)}
            icon={TrendingUp}
            color="green"
            loading={loading}
          />
          <ModernKPICard
            title="Outstanding Debt"
            value={formatCurrency(metrics?.totalDebt)}
            icon={AlertTriangle}
            color="orange"
            loading={loading}
          />
          <ModernKPICard
            title="Low Stock Items"
            value={metrics?.lowStockProducts?.length || 0}
            icon={Package}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-neutral-200 shadow-md animate-scale-in">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Quick Actions</h2>
              <p className="text-neutral-600 text-xs sm:text-sm mt-1">Frequently used tasks</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickActionBtn 
                href="/dashboard/retailers" 
                icon={Users} 
                label="Add Retailer" 
              />
              <QuickActionBtn 
                href="/dashboard/products" 
                icon={Package} 
                label="Add Product"
              />
              <QuickActionBtn 
                href="/dashboard/orders" 
                icon={ShoppingCart} 
                label="Create Order"
              />
              <QuickActionBtn 
                href="/dashboard/inventory" 
                icon={Warehouse} 
                label="Stock Management"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Overdue Retailers */}
          <Card className="border-2 border-neutral-200 shadow-md animate-slide-up">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Overdue Payments</h3>
                  <p className="text-neutral-600 text-xs sm:text-sm mt-1">
                    {metrics?.overdueRetailers?.length || 0} retailers need attention
                  </p>
                </div>
                <Link href="/dashboard/retailers?filter=overdue">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
                    View All
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-neutral-100 rounded-xl animate-shimmer" />
                  ))
                ) : metrics?.overdueRetailers?.length > 0 ? (
                  metrics.overdueRetailers.slice(0, 5).map((retailer) => (
                    <div key={retailer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:shadow-md transition-all duration-200 gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-neutral-900 text-sm truncate">{retailer.shop_name}</p>
                          <p className="text-xs text-neutral-600 truncate">{retailer.owner_name}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-10 sm:pl-0">
                        <p className="font-bold text-red-600 text-sm sm:text-base">{formatCurrency(retailer.current_balance)}</p>
                        <p className="text-xs text-neutral-500">Overdue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-success-500 mx-auto mb-3" />
                    <p className="text-neutral-600">No overdue payments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card className="border-2 border-neutral-200 shadow-md animate-slide-up">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Low Stock Alert</h3>
                  <p className="text-neutral-600 text-xs sm:text-sm mt-1">
                    {metrics?.lowStockProducts?.length || 0} products need restocking
                  </p>
                </div>
                <Link href="/dashboard/products?filter=low-stock">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
                    View All
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-neutral-100 rounded-xl animate-shimmer" />
                  ))
                ) : metrics?.lowStockProducts?.length > 0 ? (
                  metrics.lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-orange-50 border-2 border-orange-200 rounded-xl hover:shadow-md transition-all duration-200 gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                          <Package className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-neutral-900 text-sm truncate">{product.name}</p>
                          <p className="text-xs text-neutral-600">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-10 sm:pl-0">
                        <p className="font-bold text-orange-600 text-sm sm:text-base">{product.stock_quantity} left</p>
                        <p className="text-xs text-neutral-500">Restock soon</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-success-500 mx-auto mb-3" />
                    <p className="text-neutral-600">All products well stocked</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-2 border-neutral-200 shadow-md animate-fade-in">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Recent Activity</h3>
                <p className="text-neutral-600 text-xs sm:text-sm mt-1">Latest updates from your business</p>
              </div>
              <Link href="/dashboard/activity-log">
                <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
                  View All
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-shimmer" />
                ))
              ) : metrics?.recentActivity?.length > 0 ? (
                <>
                  {/* Display activities with mobile limit */}
                  {(showAllActivities 
                    ? metrics.recentActivity.slice(0, 5)
                    : metrics.recentActivity.slice(0, 3)
                  ).map((activity) => {
                  // Map action to icon and color
                  const getActivityDisplay = (action, entityType, details) => {
                    const detailsObj = typeof details === 'string' ? JSON.parse(details) : details
                    
                    switch (action) {
                      case 'create':
                        if (entityType === 'order') return { 
                          icon: <ShoppingCart className="h-4 w-4" />, 
                          title: 'New order created',
                          description: `Order #${detailsObj?.order_id || 'N/A'} from ${detailsObj?.retailer_name || 'retailer'}`,
                          color: 'blue'
                        }
                        if (entityType === 'retailer') return { 
                          icon: <Users className="h-4 w-4" />, 
                          title: 'New retailer added',
                          description: detailsObj?.shop_name || 'Retailer onboarded',
                          color: 'green'
                        }
                        if (entityType === 'product') return { 
                          icon: <Package className="h-4 w-4" />, 
                          title: 'Product added',
                          description: detailsObj?.name || 'New product created',
                          color: 'purple'
                        }
                        if (entityType === 'payment') return { 
                          icon: <DollarSign className="h-4 w-4" />, 
                          title: 'Payment recorded',
                          description: `${formatCurrency(detailsObj?.amount || 0)} from ${detailsObj?.retailer_name || 'retailer'}`,
                          color: 'green'
                        }
                        break
                      case 'update':
                        if (entityType === 'order') return { 
                          icon: <ShoppingCart className="h-4 w-4" />, 
                          title: 'Order updated',
                          description: `Order #${detailsObj?.order_id || 'N/A'} status: ${detailsObj?.new_status || 'updated'}`,
                          color: 'blue'
                        }
                        if (entityType === 'inventory') return { 
                          icon: <Package className="h-4 w-4" />, 
                          title: 'Stock updated',
                          description: `${detailsObj?.product_name || 'Product'}: ${detailsObj?.quantity_change || 0} units`,
                          color: 'purple'
                        }
                        if (entityType === 'product') return { 
                          icon: <Package className="h-4 w-4" />, 
                          title: 'Product updated',
                          description: detailsObj?.name || 'Product modified',
                          color: 'purple'
                        }
                        break
                      case 'delete':
                        return { 
                          icon: <AlertTriangle className="h-4 w-4" />, 
                          title: `${entityType} deleted`,
                          description: detailsObj?.name || `${entityType} removed`,
                          color: 'orange'
                        }
                      default:
                        return { 
                          icon: <Activity className="h-4 w-4" />, 
                          title: `${action} ${entityType}`,
                          description: detailsObj?.name || 'Activity recorded',
                          color: 'blue'
                        }
                    }
                    
                    return { 
                      icon: <Activity className="h-4 w-4" />, 
                      title: `${action} ${entityType}`,
                      description: 'Activity recorded',
                      color: 'blue'
                    }
                  }

                  const display = getActivityDisplay(activity.action, activity.entity_type, activity.details)
                  const timeAgo = getTimeAgo(activity.created_at)

                  return (
                    <ActivityItem 
                      key={activity.id}
                      icon={display.icon}
                      title={display.title}
                      description={display.description}
                      time={timeAgo}
                      color={display.color}
                    />
                  )
                })
              }
              
              {/* View More Button - Show if there are more than 3 activities */}
              {!showAllActivities && metrics.recentActivity.length > 3 && (
                <div className="pt-2">
                  <Button
                    onClick={() => setShowAllActivities(true)}
                    variant="outline"
                    className="w-full border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 font-semibold"
                  >
                    View More ({metrics.recentActivity.length - 3} more)
                  </Button>
                </div>
              )}
              
              {/* Show Less Button */}
              {showAllActivities && metrics.recentActivity.length > 3 && (
                <div className="pt-2">
                  <Button
                    onClick={() => setShowAllActivities(false)}
                    variant="outline"
                    className="w-full border-2 border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold"
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ icon, title, description, time, color = "blue" }) {
  const colors = {
    blue: "bg-primary-100 text-primary-600",
    green: "bg-success-100 text-success-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600"
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors duration-200">
      <div className={`p-2 rounded-lg ${colors[color]} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-600 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-neutral-500 text-xs flex-shrink-0">
        <Clock className="h-3 w-3" />
        {time}
      </div>
    </div>
  )
}
