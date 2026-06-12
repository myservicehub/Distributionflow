'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Package, Warehouse, Users, DollarSign, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

// Mobile Card Component for Empty Inventory Items
function EmptyInventoryMobileCard({ item, formatCurrency, onViewDetails }) {
  const totalQty = item.warehouse_qty + item.retailer_qty
  const totalItemValue = totalQty * item.deposit_value
  const warehousePercent = totalQty > 0 ? Math.round((item.warehouse_qty / totalQty) * 100) : 0

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{item.name}</h3>
              </div>
              <p className="text-xs text-neutral-500">Deposit: {formatCurrency(item.deposit_value)}/unit</p>
            </div>
            {item.warehouse_qty === 0 ? (
              <Badge variant="destructive" className="font-medium flex-shrink-0">No Stock</Badge>
            ) : item.warehouse_qty < 10 ? (
              <Badge variant="secondary" className="font-medium flex-shrink-0">Low Stock</Badge>
            ) : (
              <Badge variant="default" className="bg-success-600 font-medium flex-shrink-0">In Stock</Badge>
            )}
          </div>

          {/* Warehouse & Retailer Quantities */}
          <div className="grid grid-cols-2 gap-3 py-2 border-y border-neutral-200">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Warehouse className="h-3 w-3 text-blue-600" />
                <p className="text-xs text-blue-700 font-medium">Warehouse</p>
              </div>
              <p className="text-lg font-bold text-blue-600">{item.warehouse_qty.toLocaleString()}</p>
              <p className="text-xs text-blue-600">{warehousePercent}% of total</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Users className="h-3 w-3 text-orange-600" />
                <p className="text-xs text-orange-700 font-medium">Retailers</p>
              </div>
              <p className="text-lg font-bold text-orange-600">{item.retailer_qty.toLocaleString()}</p>
              {item.retailer_count > 0 && (
                <p className="text-xs text-orange-600">{item.retailer_count} retailer{item.retailer_count > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-3">
            <div>
              <p className="text-xs text-neutral-600">Total Quantity</p>
              <p className="text-xl font-bold text-neutral-900">{totalQty.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-600">Total Value</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalItemValue)}</p>
            </div>
          </div>

          {/* View Details Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(item)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EmptyInventoryOverviewPage() {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [emptyItems, setEmptyItems] = useState([])
  const [warehouseInventory, setWarehouseInventory] = useState([])
  const [retailerBalances, setRetailerBalances] = useState([])
  const [overview, setOverview] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const handleViewDetails = (item) => {
    setSelectedItem(item)
    setDetailsDialogOpen(true)
  }

  useEffect(() => {
    const controller = new AbortController()
    
    loadData(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadData = async (signal) => {
    try {
      // Load all data in parallel
      const [emptyRes, warehouseRes, balancesRes] = await Promise.all([
        fetch('/api/empty-bottles?route=empty-items', { signal }),
        fetch('/api/empty-bottles?route=warehouse-empty-inventory', { signal }),
        fetch('/api/empty-bottles?route=retailer-empty-balances', { signal })
      ])

      const emptyData = emptyRes.ok ? await emptyRes.json() : []
      const warehouseData = warehouseRes.ok ? await warehouseRes.json() : []
      const balancesData = balancesRes.ok ? await balancesRes.json() : []

      setEmptyItems(emptyData)
      setWarehouseInventory(warehouseData)
      setRetailerBalances(balancesData)

      // Create comprehensive overview
      const overviewMap = new Map()

      // Add warehouse inventory
      warehouseData.forEach(inv => {
        const empty = emptyData.find(e => e.id === inv.empty_item_id)
        if (empty) {
          overviewMap.set(inv.empty_item_id, {
            id: inv.empty_item_id,
            name: empty.name,
            deposit_value: parseFloat(empty.deposit_value || 0),
            warehouse_qty: inv.quantity_available || 0,
            retailer_qty: 0,
            retailer_count: 0
          })
        }
      })

      // Add retailer balances
      balancesData.forEach(balance => {
        const emptyId = balance.empty_item_id
        if (overviewMap.has(emptyId)) {
          const existing = overviewMap.get(emptyId)
          existing.retailer_qty += balance.quantity_outstanding || 0
          existing.retailer_count += 1
        } else {
          const empty = emptyData.find(e => e.id === emptyId)
          if (empty) {
            overviewMap.set(emptyId, {
              id: emptyId,
              name: empty.name,
              deposit_value: parseFloat(empty.deposit_value || 0),
              warehouse_qty: 0,
              retailer_qty: balance.quantity_outstanding || 0,
              retailer_count: 1
            })
          }
        }
      })

      setOverview(Array.from(overviewMap.values()))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalWarehouse = overview.reduce((sum, item) => sum + item.warehouse_qty, 0)
  const totalWithRetailers = overview.reduce((sum, item) => sum + item.retailer_qty, 0)
  const totalValue = overview.reduce((sum, item) => 
    sum + ((item.warehouse_qty + item.retailer_qty) * item.deposit_value), 0
  )
  const warehouseValue = overview.reduce((sum, item) => 
    sum + (item.warehouse_qty * item.deposit_value), 0
  )
  const retailerValue = overview.reduce((sum, item) => 
    sum + (item.retailer_qty * item.deposit_value), 0
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory overview...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!['admin', 'manager', 'warehouse'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admin, managers, and warehouse staff can view inventory.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Empty Bottle Inventory Overview</h1>
        <p className="text-muted-foreground mt-2">
          Complete view of all empty bottles - in warehouse and with retailers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Warehouse</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalWarehouse.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(warehouseValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Retailers</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalWithRetailers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(retailerValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empties</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(totalWarehouse + totalWithRetailers).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Deposit value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      {totalWarehouse === 0 && totalWithRetailers === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No empty bottle inventory found. Add empty items and record manufacturer supply to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Inventory - Mobile View (Card Layout) */}
      {overview.length > 0 && (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Inventory Breakdown ({overview.length})</h3>
            </div>
            {overview.map((item) => (
              <EmptyInventoryMobileCard
                key={item.id}
                item={item}
                formatCurrency={formatCurrency}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <CardTitle>Inventory Breakdown by Empty Type</CardTitle>
              <CardDescription>
                Detailed view of each empty bottle type across all locations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Empty Item</TableHead>
                      <TableHead className="text-right font-semibold">In Warehouse</TableHead>
                      <TableHead className="text-right font-semibold">With Retailers</TableHead>
                      <TableHead className="text-right font-semibold">Total Qty</TableHead>
                      <TableHead className="text-right font-semibold">Deposit/Unit</TableHead>
                      <TableHead className="text-right font-semibold">Total Value</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.map((item) => {
                      const totalQty = item.warehouse_qty + item.retailer_qty
                      const totalItemValue = totalQty * item.deposit_value
                      const warehousePercent = totalQty > 0 ? Math.round((item.warehouse_qty / totalQty) * 100) : 0
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-emerald-50 transition-colors duration-150">
                          <TableCell className="font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-blue-600">
                                {item.warehouse_qty.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {warehousePercent}% of total
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-orange-600">
                                {item.retailer_qty.toLocaleString()}
                              </span>
                              {item.retailer_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {item.retailer_count} retailer{item.retailer_count > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-neutral-900">
                            {totalQty.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-neutral-900">
                            {formatCurrency(item.deposit_value)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-neutral-900">
                            {formatCurrency(totalItemValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.warehouse_qty === 0 ? (
                              <Badge variant="destructive" className="font-medium">No Stock</Badge>
                            ) : item.warehouse_qty < 10 ? (
                              <Badge variant="secondary" className="font-medium">Low Stock</Badge>
                            ) : (
                              <Badge variant="default" className="bg-success-600 font-medium">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Details Dialog for Mobile */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              View detailed inventory breakdown for this empty bottle item.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                  <span className="text-sm text-neutral-600">Deposit Value/Unit:</span>
                  <span className="font-bold text-lg text-neutral-900">{formatCurrency(selectedItem.deposit_value)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Warehouse className="h-4 w-4 text-blue-700" />
                      <p className="text-xs font-medium text-blue-700">In Warehouse</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{selectedItem.warehouse_qty.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedItem.warehouse_qty + selectedItem.retailer_qty > 0 
                        ? Math.round((selectedItem.warehouse_qty / (selectedItem.warehouse_qty + selectedItem.retailer_qty)) * 100)
                        : 0}% of total
                    </p>
                  </div>

                  <div className="bg-orange-100 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Users className="h-4 w-4 text-orange-700" />
                      <p className="text-xs font-medium text-orange-700">With Retailers</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">{selectedItem.retailer_qty.toLocaleString()}</p>
                    {selectedItem.retailer_count > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {selectedItem.retailer_count} retailer{selectedItem.retailer_count > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-100 rounded-lg p-3 border-2 border-emerald-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-emerald-700">Total Quantity:</span>
                    <span className="text-2xl font-bold text-emerald-800">
                      {(selectedItem.warehouse_qty + selectedItem.retailer_qty).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                    <span className="text-sm font-medium text-emerald-700">Total Value:</span>
                    <span className="text-xl font-bold text-emerald-800">
                      {formatCurrency((selectedItem.warehouse_qty + selectedItem.retailer_qty) * selectedItem.deposit_value)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-2">
                  {selectedItem.warehouse_qty === 0 ? (
                    <Badge variant="destructive" className="font-medium">No Stock in Warehouse</Badge>
                  ) : selectedItem.warehouse_qty < 10 ? (
                    <Badge variant="secondary" className="font-medium">Low Stock Warning</Badge>
                  ) : (
                    <Badge variant="default" className="bg-success-600 font-medium">In Stock</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Warehouse</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ 
                        width: `${totalWarehouse + totalWithRetailers > 0 ? (totalWarehouse / (totalWarehouse + totalWithRetailers)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {totalWarehouse + totalWithRetailers > 0 
                      ? Math.round((totalWarehouse / (totalWarehouse + totalWithRetailers)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">With Retailers</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-600"
                      style={{ 
                        width: `${totalWarehouse + totalWithRetailers > 0 
                          ? (totalWithRetailers / (totalWarehouse + totalWithRetailers)) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {totalWarehouse + totalWithRetailers > 0 
                      ? Math.round((totalWithRetailers / (totalWarehouse + totalWithRetailers)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Empty Types:</span>
                <span className="font-medium">{overview.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Deposit Value:</span>
                <span className="font-medium">
                  {overview.length > 0 
                    ? formatCurrency(overview.reduce((sum, i) => sum + i.deposit_value, 0) / overview.length)
                    : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items Out of Stock:</span>
                <span className="font-medium text-red-600">
                  {overview.filter(i => i.warehouse_qty === 0).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
