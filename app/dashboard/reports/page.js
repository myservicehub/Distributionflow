'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, TrendingDown, BarChart3, Package, Store, Calendar, CreditCard, AlertTriangle, DollarSign, ShoppingBag } from 'lucide-react'

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
                ₦{(parseFloat(rep.total) / rep.orders).toLocaleString(undefined, {maximumFractionDigits: 0})}
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

export default function ReportsPage() {
  const [debtAging, setDebtAging] = useState([])
  const [salesByRep, setSalesByRep] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedReps, setExpandedReps] = useState({})

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

  const loadReports = async (signal) => {
    try {
      const debtResponse = await fetch('/api/reports/debt-aging', { signal })
      if (debtResponse.ok) {
        const debtData = await debtResponse.json()
        setDebtAging(debtData)
      }

      const salesResponse = await fetch('/api/reports/sales-by-rep')
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        setSalesByRep(salesData)
      }

      const inventoryResponse = await fetch('/api/reports/inventory')
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        setInventory(inventoryData)
      }
    } catch (error) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
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
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-900">Debt Aging Report</CardTitle>
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
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-900">Sales Performance by Representative (Today)</CardTitle>
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
                      <>
                        <TableRow key={`${rep.name}-${idx}`} className="cursor-pointer hover:bg-emerald-50 transition-colors duration-150">
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
                            ₦{(parseFloat(rep.total) / rep.orders).toLocaleString(undefined, {maximumFractionDigits: 2})}
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
                      </>
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
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-neutral-900">Inventory Report</CardTitle>
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
      </Tabs>
    </div>
  )
}
