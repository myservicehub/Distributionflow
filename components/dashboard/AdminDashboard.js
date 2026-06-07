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

  // Modern KPI Card Component - Dark Theme
  const ModernKPICard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", loading }) => {
    const colorClasses = {
      blue: {
        bg: "bg-emerald-900/40",
        border: "border-emerald-700/50",
        icon: "bg-emerald-500/20",
        iconColor: "text-emerald-400",
        text: "text-emerald-400"
      },
      green: {
        bg: "bg-success-900/40",
        border: "border-success-700/50",
        icon: "bg-success-500/20",
        iconColor: "text-success-400",
        text: "text-success-400"
      },
      orange: {
        bg: "bg-orange-900/40",
        border: "border-orange-700/50",
        icon: "bg-orange-500/20",
        iconColor: "text-orange-400",
        text: "text-orange-400"
      },
      purple: {
        bg: "bg-purple-900/40",
        border: "border-purple-700/50",
        icon: "bg-purple-500/20",
        iconColor: "text-purple-400",
        text: "text-purple-400"
      }
    }

    const colorScheme = colorClasses[color]

    return (
      <Card className={`${colorScheme.bg} border-2 ${colorScheme.border} shadow-md hover:shadow-lg transition-all duration-300`}>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 bg-neutral-700 rounded animate-shimmer w-28"></div>
              <div className="h-10 bg-neutral-700 rounded animate-shimmer w-36"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-neutral-400 capitalize">{title}</p>
                <div className={`p-2 rounded-lg ${colorScheme.icon} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${colorScheme.iconColor}`} />
                </div>
              </div>
              
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white break-all">{value}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Quick Action Button - Dark Theme
  const QuickActionBtn = ({ href, icon: Icon, label, variant = "outline" }) => (
    <Link href={href}>
      <Button 
        variant={variant}
        className="w-full h-auto py-4 px-4 justify-start gap-3 bg-neutral-700/50 hover:bg-neutral-700 border-2 border-neutral-600 text-white transition-all"
      >
        <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="font-medium text-base">{label}</span>
      </Button>
    </Link>
  )

  return (
    <div className="min-h-screen bg-neutral-900 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Modern Header */}
        <div className="animate-slide-down w-full">
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium mb-2">
            <Activity className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">DASHBOARD OVERVIEW</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight break-words">
            Welcome back
          </h1>
          <p className="text-neutral-400 mt-2 text-lg sm:text-xl break-words">
            Here's what's happening with your business today
          </p>
        </div>

        {/* KPI Grid - 2x2 on Mobile, 4 columns on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-up w-full">
          <ModernKPICard
            title="Today's sales"
            value={formatCurrency(metrics?.totalSalesToday)}
            icon={DollarSign}
            color="blue"
            loading={loading}
          />
          <ModernKPICard
            title="Monthly revenue"
            value={formatCurrency(metrics?.totalSalesMonth)}
            icon={TrendingUp}
            color="green"
            loading={loading}
          />
          <ModernKPICard
            title="Outstanding debt"
            value={formatCurrency(metrics?.totalDebt)}
            icon={AlertTriangle}
            color="orange"
            loading={loading}
          />
          <ModernKPICard
            title="Low stock items"
            value={metrics?.lowStockProducts?.length || 0}
            icon={Package}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <Card className="bg-neutral-800 border-2 border-neutral-700 shadow-md animate-scale-in w-full overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white break-words">Quick actions</h2>
              <p className="text-neutral-400 text-base sm:text-lg mt-1 break-words">Frequently used tasks</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 w-full">
              <QuickActionBtn 
                href="/dashboard/retailers" 
                icon={Users} 
                label="Add retailer" 
              />
              <QuickActionBtn 
                href="/dashboard/products" 
                icon={Package} 
                label="Add product"
              />
              <QuickActionBtn 
                href="/dashboard/orders" 
                icon={ShoppingCart} 
                label="Create order"
              />
              <QuickActionBtn 
                href="/dashboard/inventory" 
                icon={Warehouse} 
                label="Stock management"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Grid - Single Column on Mobile */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full">
          
          {/* Overdue Retailers */}
          <Card className="bg-neutral-800 border-2 border-neutral-700 shadow-md animate-slide-up w-full overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Overdue payments</h3>
                  <Link href="/dashboard/retailers?filter=overdue" className="flex-shrink-0">
                    <Button variant="ghost" size="sm" className="gap-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-neutral-700">
                      View all →
                    </Button>
                  </Link>
                </div>
                <p className="text-neutral-400 text-sm">
                  {metrics?.overdueRetailers?.length || 0} retailers need attention
                </p>
              </div>

              <div className="w-full">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-neutral-700 rounded-xl animate-shimmer" />
                  ))
                ) : metrics?.overdueRetailers?.length > 0 ? (
                  metrics.overdueRetailers.slice(0, 5).map((retailer) => (
                    <div key={retailer.id} className="flex items-center justify-between p-4 bg-neutral-700/50 border border-neutral-600 rounded-xl hover:bg-neutral-700 transition-all duration-200 w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-base truncate">{retailer.shop_name}</p>
                          <p className="text-sm text-neutral-400 truncate">{retailer.owner_name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-neutral-400 text-base">No overdue payments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card className="bg-neutral-800 border-2 border-neutral-700 shadow-md animate-slide-up w-full overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Low stock alert</h3>
                  <Link href="/dashboard/products?filter=low-stock" className="flex-shrink-0">
                    <Button variant="ghost" size="sm" className="gap-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-neutral-700">
                      View all →
                    </Button>
                  </Link>
                </div>
                <p className="text-neutral-400 text-sm">
                  {metrics?.lowStockProducts?.length || 0} products need restocking
                </p>
              </div>

              <div className="w-full">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-neutral-700 rounded-xl animate-shimmer" />
                  ))
                ) : metrics?.lowStockProducts?.length > 0 ? (
                  metrics.lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-neutral-700/50 border border-neutral-600 rounded-xl hover:bg-neutral-700 transition-all duration-200 w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-base truncate">{product.name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-neutral-400 text-base">All products well stocked</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-neutral-800 border-2 border-neutral-700 shadow-md animate-fade-in w-full overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-2 mb-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Recent activity</h3>
                <Link href="/dashboard/activity-log" className="flex-shrink-0">
                  <Button variant="ghost" size="sm" className="gap-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-neutral-700">
                    View all →
                  </Button>
                </Link>
              </div>
              <p className="text-neutral-400 text-sm">Latest updates from your business</p>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-shimmer" />
                ))
              ) : metrics?.recentActivity?.length > 0 ? (
                metrics.recentActivity.slice(0, 5).map((activity) => {
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
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// Activity Item Component - Dark Theme
function ActivityItem({ icon, title, description, time, color = "blue" }) {
  const colors = {
    blue: "bg-emerald-500/20 text-emerald-400",
    green: "bg-success-500/20 text-success-400",
    purple: "bg-purple-500/20 text-purple-400",
    orange: "bg-orange-500/20 text-orange-400"
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-700/30 hover:bg-neutral-700/50 transition-colors duration-200 border border-neutral-700">
      <div className={`p-2 rounded-lg ${colors[color]} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-sm text-neutral-400 truncate mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-neutral-500 text-xs flex-shrink-0">
        <Clock className="h-3 w-3" />
        <span className="text-xs">{time}</span>
      </div>
    </div>
  )
}
