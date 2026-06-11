'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, TrendingDown, BarChart3, Package, Store, Calendar, CreditCard, AlertTriangle, DollarSign, ShoppingBag, Download, TruckIcon, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { DateRangeFilter, getDateRangeStart } from '@/components/ui/date-range-filter'

// CSV Export utility function
function exportToCSV(data, filename, columns) {
  const headers = columns.map(c => c.label).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = c.getValue(row)
      // Wrap in quotes if contains comma or newline
      return typeof val === 'string' && (val.includes(',') || val.includes('\n'))
        ? `"${val.replace(/"/g, '""')}"`
        : val
    }).join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// Mobile Card for Debt Aging
function DebtAgingMobileCard({ item }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{item.shop_name}</h3>
              </div>
              <p className="text-xs text-neutral-500">{item.days_outstanding} days outstanding</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xl font-bold text-red-600">
                ₦{parseFloat(item.current_balance).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
            <span className="text-sm text-neutral-600">Aging:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              item.aging_category === '90+ days' ? 'bg-red-100 text-red-800 border border-red-200' :
              item.aging_category === '60-90 days' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
              item.aging_category === '30-60 days' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {item.aging_category}
            </span>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Credit Limit:</span>
                <span className="font-medium text-neutral-900">₦{parseFloat(item.credit_limit).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Days Outstanding:</span>
                <span className="font-medium text-neutral-900">{item.days_outstanding} days</span>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" />View More Details</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile Card for Sales by Rep
function SalesByRepMobileCard({ rep }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-neutral-900 truncate">{rep.name}</h3>
              <p className="text-xs text-neutral-500">{rep.orders} orders today</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xl font-bold text-emerald-600">
                ₦{parseFloat(rep.total).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="py-2 px-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-xs text-neutral-600">Items Sold</p>
              <p className="text-lg font-bold text-emerald-600">{rep.items || 0}</p>
            </div>
            <div className="py-2 px-3 bg-neutral-50 rounded-lg text-center">
              <p className="text-xs text-neutral-600">Avg Order</p>
              <p className="text-lg font-bold text-neutral-900">
                {rep.orders > 0
                  ? `₦${(parseFloat(rep.total) / rep.orders).toLocaleString(undefined, {maximumFractionDigits: 0})}`
                  : '—'}
              </p>
            </div>
          </div>

          {isExpanded && rep.products && rep.products.length > 0 && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              <h4 className="font-semibold text-sm text-neutral-900">Products Sold:</h4>
              {rep.products.map((product, idx) => (
                <div key={idx} className="bg-neutral-50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-neutral-900 text-sm">{product.name}</span>
                    <span className="text-emerald-600 font-bold text-sm">₦{parseFloat(product.totalValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Qty: {product.quantity}</span>
                    <span>@ ₦{parseFloat(product.unitPrice).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" />View Products</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile Card for Inventory
function InventoryMobileCard({ product }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const stockValue = product.stock_quantity * parseFloat(product.cost_price || 0)
  const isLowStock = product.stock_quantity <= product.low_stock_threshold

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-neutral-900">{product.name}</h3>
              <p className="text-xs text-neutral-500">SKU: {product.sku || '-'}</p>
            </div>
            {isLowStock && (
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <span className="text-sm text-neutral-600">Stock:</span>
            <span className={`font-bold text-lg ${isLowStock ? 'text-orange-600' : 'text-emerald-600'}`}>
              {product.stock_quantity} units
            </span>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down">
              <div className="grid grid-cols-2 gap-2">
                <div className="py-2 px-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-600">Cost Price</p>
                  <p className="text-sm font-bold text-neutral-900">₦{parseFloat(product.cost_price || 0).toLocaleString()}</p>
                </div>
                <div className="py-2 px-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-600">Selling Price</p>
                  <p className="text-sm font-bold text-neutral-900">₦{parseFloat(product.selling_price || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="py-2 px-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-neutral-600">Stock Value</p>
                <p className="text-lg font-bold text-emerald-600">₦{stockValue.toLocaleString()}</p>
              </div>
              <div className="py-2 px-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-neutral-600">Low Stock Alert</p>
                <p className="text-sm font-medium text-orange-900">{product.low_stock_threshold} units</p>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" />View More Details</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile Card for Driver Performance
function DriverPerformanceMobileCard({ driver }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const successRate = driver.success_rate || 0

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TruckIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{driver.name}</h3>
              </div>
              <p className="text-xs text-neutral-500">{driver.vehicle_number || 'No vehicle'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xl font-bold text-emerald-600">
                {driver.deliveries_in_range}
              </p>
              <p className="text-xs text-neutral-500">deliveries</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="py-2 px-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-xs text-neutral-600">Success</span>
              </div>
              <p className="text-sm font-bold text-green-700">{driver.successful_in_range}</p>
            </div>
            <div className="py-2 px-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-xs text-neutral-600">Failed</span>
              </div>
              <p className="text-sm font-bold text-red-700">{driver.failed_in_range}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <span className="text-sm text-neutral-600">Success Rate:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              successRate >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
              successRate >= 75 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              successRate >= 50 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {successRate}%
            </span>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Total (All-Time):</span>
                <span className="font-medium text-neutral-900">{driver.total_deliveries}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Avg. Time:</span>
                <span className="font-medium text-neutral-900">{driver.avg_delivery_time_hours}h</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
                <span className="text-sm text-neutral-600">Revenue:</span>
                <span className="font-medium text-emerald-700">₦{parseFloat(driver.total_revenue || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" />View More Details</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [debtAging, setDebtAging] = useState([])
  const [salesByRep, setSalesByRep] = useState([])
  const [inventory, setInventory] = useState([])
  const [driverPerformance, setDriverPerformance] = useState([])
  const [driverSummary, setDriverSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedReps, setExpandedReps] = useState({})
  const [dateRange, setDateRange] = useState('30d')

  // Helper to get human-readable range label
  const rangeLabel = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    all: 'All Time'
  }[dateRange]

  const toggleRepExpand = (repName) => {
    setExpandedReps(prev => ({
      ...prev,
      [repName]: !prev[repName]
    }))
  }

  useEffect(() => {
    const controller = new AbortController()
    
    loadReports(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadReports = async (signal, range = dateRange) => {
    try {
      const start = getDateRangeStart(range)
      const params = new URLSearchParams()
      if (start) params.set('from', start.toISOString())
      const rangeParam = `range=${range}`

      // Debt aging is always current snapshot - no date filter
      const debtResponse = await fetch('/api/reports/debt-aging', { signal })
      if (debtResponse.ok) {
        const debtData = await debtResponse.json()
        setDebtAging(debtData)
      }

      // Sales by rep - apply date filter
      const salesResponse = await fetch(`/api/reports/sales-by-rep?${params}&${rangeParam}`, { signal })
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        setSalesByRep(salesData)
      }

      // Inventory is a snapshot - no date filter
      const inventoryResponse = await fetch('/api/reports/inventory', { signal })
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        setInventory(inventoryData)
      }

      // Driver performance - apply date filter
      const driverResponse = await fetch(`/api/reports/driver-performance?${params}&${rangeParam}`, { signal })
      if (driverResponse.ok) {
        const driverData = await driverResponse.json()
        if (driverData.success && driverData.data) {
          setDriverPerformance(driverData.data.drivers || [])
          setDriverSummary(driverData.data.summary || null)
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (range) => {
    setDateRange(range)
    loadReports(undefined, range)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="animate-slide-down">
        <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Reports</h2>
        <p className="text-neutral-600 mt-2">Business analytics and insights</p>
      </div>

      <Tabs defaultValue="debt" className="space-y-6">
        <TabsList className="bg-white border border-neutral-200 p-1">
          <TabsTrigger value="debt" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Debt Aging</TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Sales by Rep</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Inventory Report</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Driver Performance</TabsTrigger>
        </TabsList>

        {/* Debt Aging Report */}
        <TabsContent value="debt" className="space-y-4">
          {/* Mobile View */}
          <div className="block md:hidden space-y-4 animate-fade-in">
            {debtAging.length === 0 ? (
              <Card className="border-2 border-neutral-200">
                <CardContent className="p-0">
                  <div className="text-center py-16">
                    <p className="text-neutral-600 text-lg font-medium">No outstanding debts</p>
                    <p className="text-neutral-500 text-sm mt-1">All retailers are up to date with payments</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Debt Aging Report</h3>
                </div>
                {debtAging.map((item) => (
                  <DebtAgingMobileCard key={item.shop_name} item={item} />
                ))}
              </>
            )}
          </div>

          {/* Desktop View */}
          <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-neutral-900">Debt Aging Report</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(debtAging, 'debt-aging', [
                    { label: 'Retailer', getValue: r => r.shop_name },
                    { label: 'Outstanding Balance (₦)', getValue: r => r.current_balance },
                    { label: 'Credit Limit (₦)', getValue: r => r.credit_limit },
                    { label: 'Aging Category', getValue: r => r.aging_category },
                    { label: 'Days Outstanding', getValue: r => r.days_outstanding },
                    { label: 'Last Payment Date', getValue: r => r.last_payment_date || 'Never' },
                  ])}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Retailer</TableHead>
                      <TableHead className="font-semibold">Outstanding Balance</TableHead>
                      <TableHead className="font-semibold">Credit Limit</TableHead>
                      <TableHead className="font-semibold">Aging Category</TableHead>
                      <TableHead className="font-semibold">Days Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtAging.map((item) => (
                      <TableRow key={item.shop_name} className="hover:bg-emerald-50 transition-colors duration-150">
                        <TableCell className="font-medium text-neutral-900">{item.shop_name}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          ₦{parseFloat(item.current_balance).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-neutral-700">₦{parseFloat(item.credit_limit).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.aging_category === '90+ days' ? 'bg-red-100 text-red-800 border border-red-200' :
                            item.aging_category === '60-90 days' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            item.aging_category === '30-60 days' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.aging_category}
                          </span>
                        </TableCell>
                        <TableCell className="text-neutral-700">{item.days_outstanding} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {debtAging.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-neutral-600 text-lg font-medium">No outstanding debts</p>
                    <p className="text-neutral-500 text-sm mt-1">All retailers are up to date with payments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Rep Report */}
        <TabsContent value="sales" className="space-y-4">
          {/* Date Range Filter - Only on Sales tab */}
          <DateRangeFilter value={dateRange} onChange={handleDateChange} />

          {/* Mobile View */}
          <div className="block md:hidden space-y-4 animate-fade-in">
            {salesByRep.length === 0 ? (
              <Card className="border-2 border-neutral-200">
                <CardContent className="p-0">
                  <div className="text-center py-16">
                    <p className="text-neutral-600 text-lg font-medium">No sales data available</p>
                    <p className="text-neutral-500 text-sm mt-1">Sales will appear here once orders are created</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Sales by Rep (Today)</h3>
                </div>
                {salesByRep.map((rep, idx) => (
                  <SalesByRepMobileCard key={`${rep.name}-${idx}`} rep={rep} />
                ))}
              </>
            )}
          </div>

          {/* Desktop View */}
          <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-neutral-900">Sales Performance by Representative ({rangeLabel})</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(salesByRep, 'sales-by-rep', [
                    { label: 'Sales Rep', getValue: r => r.name },
                    { label: 'Email', getValue: r => r.email },
                    { label: 'Total Orders', getValue: r => r.orders },
                    { label: 'Total Items Sold', getValue: r => r.items },
                    { label: 'Total Sales (₦)', getValue: r => r.total },
                    { label: 'Average Order (₦)', getValue: r => r.orders > 0 ? (r.total / r.orders).toFixed(2) : 0 },
                  ])}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="font-semibold">Sales Representative</TableHead>
                      <TableHead className="font-semibold">Total Orders</TableHead>
                      <TableHead className="font-semibold">Total Items Sold</TableHead>
                      <TableHead className="font-semibold">Total Sales</TableHead>
                      <TableHead className="font-semibold">Average Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByRep.map((rep, idx) => (
                      <React.Fragment key={`${rep.name}-${idx}`}>
                        <TableRow className="cursor-pointer hover:bg-emerald-50 transition-colors duration-150">
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleRepExpand(rep.name)}
                              className="p-1 h-auto hover:bg-emerald-100 rounded-lg"
                            >
                              {expandedReps[rep.name] ? (
                                <ChevronUp className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-neutral-600" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900">{rep.name}</TableCell>
                          <TableCell className="text-neutral-700">{rep.orders}</TableCell>
                          <TableCell className="font-semibold text-emerald-600">{rep.items || 0}</TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            ₦{parseFloat(rep.total).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-neutral-700">
                            {rep.orders > 0
                              ? `₦${(parseFloat(rep.total) / rep.orders).toLocaleString(undefined, {maximumFractionDigits: 0})}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                        {expandedReps[rep.name] && rep.products && rep.products.length > 0 && (
                          <TableRow key={`${rep.name}-details-${idx}`}>
                            <TableCell colSpan={6} className="bg-emerald-50 border-t border-neutral-200 p-6">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-lg text-neutral-900 mb-3">Products Sold by {rep.name}</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-white">
                                      <TableHead>Product Name</TableHead>
                                      <TableHead>SKU</TableHead>
                                      <TableHead className="text-right">Quantity Sold</TableHead>
                                      <TableHead className="text-right">Unit Price</TableHead>
                                      <TableHead className="text-right">Total Value</TableHead>
                                      <TableHead>Sale Dates</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {rep.products.map((product, pIdx) => (
                                      <TableRow key={pIdx}>
                                        <TableCell className="font-medium text-neutral-900">{product.name}</TableCell>
                                        <TableCell className="text-sm text-neutral-600">{product.sku || '-'}</TableCell>
                                        <TableCell className="text-right font-semibold text-emerald-600">
                                          {product.quantity}
                                        </TableCell>
                                        <TableCell className="text-right text-neutral-700">
                                          ₦{parseFloat(product.unitPrice).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-emerald-600">
                                          ₦{parseFloat(product.totalValue).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {product.sales && product.sales.map((sale, sIdx) => (
                                              <div key={sIdx} className="text-xs flex justify-between gap-2 py-1 border-b border-neutral-100 last:border-0">
                                                <span className="text-neutral-600">
                                                  {new Date(sale.date).toLocaleDateString()}
                                                </span>
                                                <span className="font-medium text-neutral-900">
                                                  {sale.quantity} × ₦{parseFloat(sale.value / sale.quantity).toLocaleString()} = ₦{parseFloat(sale.value).toLocaleString()}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
                {salesByRep.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-neutral-600 text-lg font-medium">No sales data available</p>
                    <p className="text-neutral-500 text-sm mt-1">Sales will appear here once orders are created</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Mobile View */}
          <div className="block md:hidden space-y-4 animate-fade-in">
            {inventory.length === 0 ? (
              <Card className="border-2 border-neutral-200">
                <CardContent className="p-0">
                  <div className="text-center py-16">
                    <p className="text-neutral-600 text-lg font-medium">No inventory data</p>
                    <p className="text-neutral-500 text-sm mt-1">Add products to see inventory reports</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Inventory Report</h3>
                </div>
                {inventory.map((product) => (
                  <InventoryMobileCard key={product.id} product={product} />
                ))}
              </>
            )}
          </div>

          {/* Desktop View */}
          <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-neutral-900">Inventory Report</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(inventory, 'inventory', [
                    { label: 'Product Name', getValue: p => p.name },
                    { label: 'SKU', getValue: p => p.sku || '' },
                    { label: 'Stock Quantity', getValue: p => p.stock_quantity },
                    { label: 'Low Stock Threshold', getValue: p => p.low_stock_threshold || 10 },
                    { label: 'Selling Price (₦)', getValue: p => p.selling_price },
                    { label: 'Stock Status', getValue: p =>
                        p.stock_quantity === 0 ? 'Out of Stock'
                        : p.stock_quantity <= (p.low_stock_threshold || 10) ? 'Low Stock'
                        : 'In Stock'
                    },
                  ])}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Product Name</TableHead>
                      <TableHead className="font-semibold">SKU</TableHead>
                      <TableHead className="font-semibold">Stock Quantity</TableHead>
                      <TableHead className="font-semibold">Low Stock Alert</TableHead>
                      <TableHead className="font-semibold">Cost Price</TableHead>
                      <TableHead className="font-semibold">Selling Price</TableHead>
                      <TableHead className="font-semibold">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((product) => {
                      const stockValue = product.stock_quantity * parseFloat(product.cost_price || 0)
                      const isLowStock = product.stock_quantity <= product.low_stock_threshold
                      return (
                        <TableRow key={product.id} className="hover:bg-emerald-50 transition-colors duration-150">
                          <TableCell className="font-medium text-neutral-900">{product.name}</TableCell>
                          <TableCell className="text-neutral-700">{product.sku || '-'}</TableCell>
                          <TableCell className={isLowStock ? 'text-orange-600 font-semibold' : 'text-neutral-900'}>
                            {product.stock_quantity}
                          </TableCell>
                          <TableCell className="text-neutral-700">{product.low_stock_threshold}</TableCell>
                          <TableCell className="text-neutral-900">₦{parseFloat(product.cost_price || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-neutral-900">₦{parseFloat(product.selling_price || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold text-neutral-900">₦{stockValue.toLocaleString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {inventory.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-neutral-600 text-lg font-medium">No inventory data</p>
                    <p className="text-neutral-500 text-sm mt-1">Add products to see inventory reports</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card - Show on both mobile and desktop */}
          {inventory.length > 0 && (
            <Card className="border-2 border-neutral-200 shadow-lg animate-scale-in">
              <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
                <CardTitle className="text-xl font-bold text-neutral-900">Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-xl">
                    <p className="text-sm text-emerald-700 font-medium mb-2">Total Products</p>
                    <p className="text-3xl font-bold text-emerald-600">{inventory.length}</p>
                  </div>
                  <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-xl">
                    <p className="text-sm text-emerald-700 font-medium mb-2">Total Stock Value</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      ₦{inventory.reduce((sum, p) => sum + (p.stock_quantity * parseFloat(p.cost_price || 0)), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-xl">
                    <p className="text-sm text-orange-700 font-medium mb-2">Low Stock Items</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {inventory.filter(p => p.stock_quantity <= p.low_stock_threshold).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Driver Performance Report */}
        <TabsContent value="drivers" className="space-y-4">
          {/* Summary Cards */}
          {driverSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-2 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TruckIcon className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm text-neutral-600">Total Drivers</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{driverSummary.active_drivers}/{driverSummary.total_drivers}</p>
                  <p className="text-xs text-neutral-500 mt-1">Active</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-neutral-600">Deliveries ({rangeLabel})</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{driverSummary.total_deliveries_in_range}</p>
                  <p className="text-xs text-neutral-500 mt-1">Total: {driverSummary.total_deliveries_all_time}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-neutral-600">Success Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{driverSummary.overall_success_rate}%</p>
                  <p className="text-xs text-neutral-500 mt-1">{driverSummary.successful_deliveries} successful</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-neutral-600">Failed Deliveries</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{driverSummary.failed_deliveries}</p>
                  <p className="text-xs text-neutral-500 mt-1">In selected range</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <TruckIcon className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Driver Performance</h3>
                <p className="text-sm text-neutral-600">Track delivery metrics and success rates</p>
              </div>
            </div>
            <DateRangeFilter value={dateRange} onChange={handleDateChange} />
          </div>

          {/* Mobile View */}
          <div className="block md:hidden space-y-4 animate-fade-in">
            {driverPerformance.length === 0 ? (
              <Card className="border-2 border-neutral-200">
                <CardContent className="p-8 text-center">
                  <TruckIcon className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 text-lg font-medium">No drivers yet</p>
                  <p className="text-neutral-500 text-sm mt-1">Add drivers from the Staff page</p>
                </CardContent>
              </Card>
            ) : (
              driverPerformance.map((driver) => (
                <DriverPerformanceMobileCard key={driver.id} driver={driver} />
              ))
            )}
          </div>

          {/* Desktop View */}
          <Card className="hidden md:block border-2 border-neutral-200 shadow-soft animate-fade-in">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Driver</TableHead>
                      <TableHead className="font-semibold">Vehicle</TableHead>
                      <TableHead className="font-semibold text-center">Deliveries ({rangeLabel})</TableHead>
                      <TableHead className="font-semibold text-center">Success</TableHead>
                      <TableHead className="font-semibold text-center">Failed</TableHead>
                      <TableHead className="font-semibold text-center">Success Rate</TableHead>
                      <TableHead className="font-semibold text-center">Avg. Time</TableHead>
                      <TableHead className="font-semibold text-right">Total (All-Time)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-16">
                          <TruckIcon className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                          <p className="text-neutral-600 text-lg font-medium">No drivers yet</p>
                          <p className="text-neutral-500 text-sm mt-1">Add drivers from the Staff page</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      driverPerformance.map((driver) => {
                        const successRate = driver.success_rate || 0
                        return (
                          <TableRow key={driver.id} className="hover:bg-emerald-50 transition-colors">
                            <TableCell>
                              <div>
                                <p className="font-medium text-neutral-900">{driver.name}</p>
                                <p className="text-xs text-neutral-500">{driver.phone || 'No phone'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-neutral-700">{driver.vehicle_number || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-blue-600">{driver.deliveries_in_range}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-700">{driver.successful_in_range}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-700">{driver.failed_in_range}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                successRate >= 90 ? 'bg-green-100 text-green-800' :
                                successRate >= 75 ? 'bg-emerald-100 text-emerald-800' :
                                successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {successRate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="h-4 w-4 text-neutral-500" />
                                <span className="text-sm text-neutral-700">{driver.avg_delivery_time_hours}h</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-neutral-900">{driver.total_deliveries}</span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          {driverPerformance.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={() => exportToCSV(
                  driverPerformance,
                  'driver-performance',
                  [
                    { label: 'Driver Name', getValue: (d) => d.name },
                    { label: 'Vehicle', getValue: (d) => d.vehicle_number || 'N/A' },
                    { label: 'Phone', getValue: (d) => d.phone || 'N/A' },
                    { label: `Deliveries (${rangeLabel})`, getValue: (d) => d.deliveries_in_range },
                    { label: 'Successful', getValue: (d) => d.successful_in_range },
                    { label: 'Failed', getValue: (d) => d.failed_in_range },
                    { label: 'Success Rate (%)', getValue: (d) => d.success_rate },
                    { label: 'Avg. Delivery Time (hours)', getValue: (d) => d.avg_delivery_time_hours },
                    { label: 'Total Deliveries (All-Time)', getValue: (d) => d.total_deliveries },
                    { label: 'Total Revenue', getValue: (d) => d.total_revenue }
                  ]
                )}
                variant="outline"
                className="border-2 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
