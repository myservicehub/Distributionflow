'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      const response = await fetch('/api?route=/dashboard/metrics')
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

  // Modern KPI Card Component
  const ModernKPICard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", loading }) => {
    const colors = {
      blue: "from-primary-500 to-primary-600",
      green: "from-success-500 to-success-600",
      orange: "from-orange-500 to-orange-600",
      purple: "from-purple-500 to-purple-600"
    }

    return (
      <Card className="relative overflow-hidden border-0 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in group">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className={`w-full h-full rounded-full bg-gradient-to-br ${colors[color]} blur-2xl group-hover:scale-110 transition-transform duration-500`}></div>
        </div>
        
        <div className="relative p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-neutral-200 rounded animate-shimmer w-24"></div>
              <div className="h-8 bg-neutral-200 rounded animate-shimmer w-32"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-neutral-600">{title}</p>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colors[color]} bg-opacity-10`}>
                  <Icon className={`h-5 w-5 text-${color === 'blue' ? 'primary' : color === 'green' ? 'success' : color}-500`} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-bold text-neutral-900">{value}</p>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    trend === 'up' ? 'text-success-600' : 'text-red-600'
                  }`}>
                    {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{trendValue}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    )
  }

  // Quick Action Button
  const QuickActionBtn = ({ href, icon: Icon, label, variant = "default" }) => (
    <Link href={href}>
      <Button 
        variant={variant}
        className="w-full h-auto py-4 px-4 justify-start gap-3 group hover:scale-[1.02] transition-all duration-200 shadow-soft hover:shadow-medium"
      >
        <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <span className="font-medium">{label}</span>
        <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Modern Header */}
        <div className="animate-slide-down">
          <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-2">
            <Activity className="h-4 w-4" />
            <span>DASHBOARD OVERVIEW</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-neutral-600 mt-2 text-lg">
            Here's what's happening with your business today
          </p>
        </div>

        {/* KPI Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <ModernKPICard
            title="Today's Sales"
            value={formatCurrency(metrics?.totalSalesToday)}
            icon={DollarSign}
            color="blue"
            trend="up"
            trendValue="+12.5% from yesterday"
            loading={loading}
          />
          <ModernKPICard
            title="Monthly Revenue"
            value={formatCurrency(metrics?.totalSalesMonth)}
            icon={TrendingUp}
            color="green"
            trend="up"
            trendValue="+8.2% from last month"
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
        <Card className="border-0 shadow-soft animate-scale-in">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Quick Actions</h2>
                <p className="text-neutral-600 text-sm mt-1">Frequently used tasks</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionBtn 
                href="/dashboard/retailers" 
                icon={Users} 
                label="Add Retailer" 
              />
              <QuickActionBtn 
                href="/dashboard/products" 
                icon={Package} 
                label="Add Product"
                variant="outline"
              />
              <QuickActionBtn 
                href="/dashboard/orders" 
                icon={ShoppingCart} 
                label="Create Order"
                variant="outline"
              />
              <QuickActionBtn 
                href="/dashboard/inventory" 
                icon={Warehouse} 
                label="Stock Management"
                variant="outline"
              />
            </div>
          </div>
        </Card>

        {/* Data Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Overdue Retailers */}
          <Card className="border-0 shadow-soft animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Overdue Payments</h3>
                  <p className="text-neutral-600 text-sm mt-1">
                    {metrics?.overdueRetailers?.length || 0} retailers need attention
                  </p>
                </div>
                <Link href="/dashboard/retailers?filter=overdue">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
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
                    <div key={retailer.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl hover:shadow-soft transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{retailer.shop_name}</p>
                          <p className="text-sm text-neutral-600">{retailer.owner_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(retailer.current_balance)}</p>
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
            </div>
          </Card>

          {/* Low Stock Products */}
          <Card className="border-0 shadow-soft animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Low Stock Alert</h3>
                  <p className="text-neutral-600 text-sm mt-1">
                    {metrics?.lowStockProducts?.length || 0} products need restocking
                  </p>
                </div>
                <Link href="/dashboard/products?filter=low-stock">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
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
                    <div key={product.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:shadow-soft transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Package className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{product.name}</p>
                          <p className="text-sm text-neutral-600">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{product.stock_quantity} left</p>
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
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-soft animate-fade-in">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Recent Activity</h3>
                <p className="text-neutral-600 text-sm mt-1">Latest updates from your business</p>
              </div>
              <Link href="/dashboard/activity-log">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-shimmer" />
                ))
              ) : (
                <>
                  <ActivityItem 
                    icon={<ShoppingCart className="h-4 w-4" />}
                    title="New order created"
                    description="Order #1234 from ABC Store"
                    time="5 minutes ago"
                    color="blue"
                  />
                  <ActivityItem 
                    icon={<Users className="h-4 w-4" />}
                    title="New retailer added"
                    description="XYZ Mart onboarded"
                    time="1 hour ago"
                    color="green"
                  />
                  <ActivityItem 
                    icon={<Package className="h-4 w-4" />}
                    title="Stock updated"
                    description="50 units of Coca-Cola added"
                    time="3 hours ago"
                    color="purple"
                  />
                </>
              )}
            </div>
          </div>
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
