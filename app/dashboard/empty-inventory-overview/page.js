'use client'

import { useState, useEffect } from 'react'
import { Package, Warehouse, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
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
import { useAuth } from '@/lib/auth-context'

export default function EmptyInventoryOverviewPage() {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [emptyItems, setEmptyItems] = useState([])
  const [warehouseInventory, setWarehouseInventory] = useState([])
  const [retailerBalances, setRetailerBalances] = useState([])
  const [overview, setOverview] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load all data in parallel
      const [emptyRes, warehouseRes, balancesRes] = await Promise.all([
        fetch('/api/empty-bottles?route=empty-items'),
        fetch('/api/empty-bottles?route=warehouse-empty-inventory'),
        fetch('/api/empty-bottles?route=retailer-empty-balances')
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

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`
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

      {/* Detailed Inventory Table */}
      {overview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Breakdown by Empty Type</CardTitle>
            <CardDescription>
              Detailed view of each empty bottle type across all locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empty Item</TableHead>
                  <TableHead className="text-right">In Warehouse</TableHead>
                  <TableHead className="text-right">With Retailers</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Deposit/Unit</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.map((item) => {
                  const totalQty = item.warehouse_qty + item.retailer_qty
                  const totalItemValue = totalQty * item.deposit_value
                  const warehousePercent = totalQty > 0 ? Math.round((item.warehouse_qty / totalQty) * 100) : 0
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
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
                      <TableCell className="text-right font-medium">
                        {totalQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.deposit_value)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(totalItemValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.warehouse_qty === 0 ? (
                          <Badge variant="destructive">No Stock</Badge>
                        ) : item.warehouse_qty < 10 ? (
                          <Badge variant="secondary">Low Stock</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                        width: `${totalWarehouse + totalWithRetailers > 0 
                          ? (totalWarehouse / (totalWarehouse + totalWithRetailers)) * 100 
                          : 0}%` 
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
