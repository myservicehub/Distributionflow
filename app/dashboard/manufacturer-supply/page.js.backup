'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Truck, Plus, Package, ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronUp, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { DateRangeFilter, getDateRangeStart } from '@/components/ui/date-range-filter'

// Mobile Card Component for Warehouse Inventory
function WarehouseInventoryMobileCard({ item }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalValue = item.quantity_available * (item.empty_items?.deposit_value || 0)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">
                  {item.empty_items?.name || 'Unknown'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500">Available in warehouse</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-2xl font-bold text-emerald-600">
                {item.quantity_available}
              </p>
              <p className="text-xs text-neutral-500">units</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <span className="text-sm text-neutral-600">Total Value:</span>
            <span className="font-bold text-emerald-600">
              {formatCurrency(totalValue)}
            </span>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Deposit/Unit:</span>
                <span className="font-medium text-neutral-900">
                  {formatCurrency(item.empty_items?.deposit_value || 0)}
                </span>
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
              <><ChevronDown className="h-4 w-4 mr-1" />View Details</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile Card Component for Recent Movements
function MovementMobileCard({ movement }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getMovementBadge = (type) => {
    if (type === 'manufacturer_in') {
      return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Received</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Returned</Badge>
  }

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">
                  {movement.empty_items?.name || 'Unknown'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(movement.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getMovementBadge(movement.type)}
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {movement.quantity} units
              </p>
            </div>
          </div>

          {isExpanded && movement.notes && (
            <div className="pt-2 animate-slide-down border-t border-neutral-200">
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-1 font-medium">Notes:</p>
                <p className="text-sm text-neutral-700">{movement.notes}</p>
              </div>
            </div>
          )}

          {movement.notes && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
            >
              {isExpanded ? (
                <><ChevronUp className="h-4 w-4 mr-1" />Hide Notes</>
              ) : (
                <><ChevronDown className="h-4 w-4 mr-1" />View Notes</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ManufacturerSupplyPage() {
  const { userProfile } = useAuth()
  const [emptyItems, setEmptyItems] = useState([])
  const [warehouseInventory, setWarehouseInventory] = useState([])
  const [recentMovements, setRecentMovements] = useState([])
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [receiveFormData, setReceiveFormData] = useState({ empty_item_id: '', quantity: '', notes: '' })
  const [returnFormData, setReturnFormData] = useState({ empty_item_id: '', quantity: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  // Helper to get human-readable range label
  const rangeLabel = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    all: 'All Time'
  }[dateRange]

  // Filter movements by date range
  const filteredMovements = useMemo(() => {
    if (dateRange === 'all') return recentMovements
    const start = getDateRangeStart(dateRange)
    if (!start) return recentMovements
    return recentMovements.filter(m => new Date(m.created_at) >= start)
  }, [recentMovements, dateRange])

  useEffect(() => {
    const controller = new AbortController()
    
    loadData(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadData = async (signal) => {
    await Promise.all([
      loadEmptyItems(),
      loadWarehouseInventory(),
      loadRecentMovements()
    ])
    setDataLoading(false)
  }

  const loadEmptyItems = async (signal) => {
    try {
      const response = await fetch('/api/empty-bottles?route=empty-items', {
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed to load empty items')
      const data = await response.json()
      setEmptyItems(data.filter(item => item.is_active))
    } catch (error) {
      toast.error('Failed to load empty items')
      console.error(error)
    }
  }

  const loadWarehouseInventory = async (signal) => {
    try {
      const response = await fetch('/api/empty-bottles?route=warehouse-empty-inventory', {
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed to load warehouse inventory')
      const data = await response.json()
      setWarehouseInventory(data)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }
  }

  const loadRecentMovements = async (signal) => {
    try {
      const response = await fetch('/api/empty-bottles?route=empty-movements&limit=20', {
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed to load movements')
      const data = await response.json()
      // Filter for manufacturer-related movements only
      const manufacturerMovements = data.filter(m => 
        m.type === 'manufacturer_in' || m.type === 'returned_to_manufacturer'
      )
      setRecentMovements(manufacturerMovements)
    } catch (error) {
      console.error('Failed to load movements:', error)
    }
  }

  const handleReceiveSubmit = async () => {
    if (!receiveFormData.empty_item_id || !receiveFormData.quantity || parseInt(receiveFormData.quantity) <= 0) {
      toast.error('Please fill all fields correctly')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'manufacturer-supply',
          empty_item_id: receiveFormData.empty_item_id,
          quantity: parseInt(receiveFormData.quantity),
          notes: receiveFormData.notes || 'Received empties from manufacturer with full drink delivery'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record supply')
      }

      toast.success('Empties received from manufacturer successfully')
      setShowReceiveDialog(false)
      setReceiveFormData({ empty_item_id: '', quantity: '', notes: '' })
      loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnSubmit = async () => {
    if (!returnFormData.empty_item_id || !returnFormData.quantity || parseInt(returnFormData.quantity) <= 0) {
      toast.error('Please fill all fields correctly')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'return-to-manufacturer',
          empty_item_id: returnFormData.empty_item_id,
          quantity: parseInt(returnFormData.quantity),
          notes: returnFormData.notes || 'Returned empties when purchasing new drinks'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record return')
      }

      toast.success('Empties returned to manufacturer successfully')
      setShowReturnDialog(false)
      setReturnFormData({ empty_item_id: '', quantity: '', notes: '' })
      loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getMovementTypeLabel = (type) => {
    if (type === 'manufacturer_in') return 'Received'
    if (type === 'returned_to_manufacturer') return 'Returned'
    return type
  }

  const getMovementTypeColor = (type) => {
    if (type === 'manufacturer_in') return 'text-green-600 bg-green-50'
    if (type === 'returned_to_manufacturer') return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (!['admin', 'manager', 'warehouse'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only authorized roles can manage manufacturer supplies.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Manufacturer Supply Management</h1>
        <p className="text-neutral-600 mt-2">
          Manage empties received from and returned to manufacturer
        </p>
      </div>

      {/* Tabs for Receive and Return */}
      <Tabs defaultValue="receive" className="w-full">
        <TabsList className="bg-white border-2 border-neutral-200 p-1 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="receive" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <ArrowDownToLine className="h-4 w-4" />
            Receive Empties
          </TabsTrigger>
          <TabsTrigger value="return" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <ArrowUpFromLine className="h-4 w-4" />
            Return Empties
          </TabsTrigger>
        </TabsList>

        {/* Receive Tab */}
        <TabsContent value="receive" className="space-y-6">
          <Card className="border-2 border-neutral-200 shadow-sm">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <CardTitle className="text-neutral-900">Receive Empties from Manufacturer</CardTitle>
              <CardDescription>
                Record empties received when manufacturer delivers full drinks
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                onClick={() => setShowReceiveDialog(true)} 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg w-full sm:w-auto mb-6"
              >
                <Plus className="mr-2 h-5 w-5" />
                Receive Empties
              </Button>
              
              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-50">
                          <TableHead className="font-semibold">Empty Item</TableHead>
                          <TableHead className="font-semibold">Current Stock</TableHead>
                          <TableHead className="font-semibold">Deposit Value</TableHead>
                          <TableHead className="font-semibold">Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warehouseInventory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-neutral-600 py-8">
                              No inventory yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          warehouseInventory.map((item) => (
                            <TableRow key={item.id} className="hover:bg-emerald-50 transition-colors duration-150">
                              <TableCell className="font-medium text-neutral-900">
                                {item.empty_items?.name || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-emerald-600 font-semibold">{item.quantity_available} units</TableCell>
                              <TableCell className="text-neutral-900">
                                {formatCurrency(item.empty_items?.deposit_value || 0)}
                              </TableCell>
                              <TableCell className="font-semibold text-emerald-600">
                                {formatCurrency(
                                  item.quantity_available * (item.empty_items?.deposit_value || 0)
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4 p-4">
                    {warehouseInventory.length === 0 ? (
                      <div className="text-center text-neutral-600 py-8">
                        No inventory yet
                      </div>
                    ) : (
                      warehouseInventory.map((item) => (
                        <WarehouseInventoryMobileCard key={item.id} item={item} />
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Return Tab */}
        <TabsContent value="return" className="space-y-6">
          <Card className="border-2 border-neutral-200 shadow-sm">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <CardTitle className="text-neutral-900">Return Empties to Manufacturer</CardTitle>
              <CardDescription>
                Record empties returned when purchasing new drinks
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                onClick={() => setShowReturnDialog(true)} 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg w-full sm:w-auto mb-6"
              >
                <ArrowUpFromLine className="mr-2 h-5 w-5" />
                Return Empties
              </Button>
              
              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-50">
                          <TableHead className="font-semibold">Empty Item</TableHead>
                          <TableHead className="font-semibold">Available to Return</TableHead>
                          <TableHead className="font-semibold">Deposit Value</TableHead>
                          <TableHead className="font-semibold">Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warehouseInventory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-neutral-600 py-8">
                              No empties available to return
                            </TableCell>
                          </TableRow>
                        ) : (
                          warehouseInventory
                            .filter((item) => item.quantity_available > 0)
                            .map((item) => (
                              <TableRow key={item.id} className="hover:bg-emerald-50 transition-colors duration-150">
                                <TableCell className="font-medium text-neutral-900">
                                  {item.empty_items?.name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-emerald-600 font-semibold">{item.quantity_available} units</TableCell>
                                <TableCell className="text-neutral-900">
                                  {formatCurrency(item.empty_items?.deposit_value || 0)}
                                </TableCell>
                                <TableCell className="font-semibold text-emerald-600">
                                  {formatCurrency(
                                    item.quantity_available * (item.empty_items?.deposit_value || 0)
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4 p-4">
                    {warehouseInventory.length === 0 || warehouseInventory.filter((item) => item.quantity_available > 0).length === 0 ? (
                      <div className="text-center text-neutral-600 py-8">
                        No empties available to return
                      </div>
                    ) : (
                      warehouseInventory
                        .filter((item) => item.quantity_available > 0)
                        .map((item) => (
                          <WarehouseInventoryMobileCard key={item.id} item={item} />
                        ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions History */}
      <Card className="border-2 border-neutral-200 shadow-lg">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="text-neutral-900">Recent Manufacturer Transactions</CardTitle>
          <CardDescription>History of empties received from and returned to manufacturer</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Date Range Filter */}
          <DateRangeFilter value={dateRange} onChange={setDateRange} />

          {dataLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Empty Item</TableHead>
                      <TableHead className="font-semibold">Quantity</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-neutral-600 py-12">
                          <Package className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                          <p className="font-medium">
                            {dateRange !== 'all' ? 'No transactions in the selected period' : 'No transactions yet'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((movement) => (
                        <TableRow key={movement.id} className="hover:bg-emerald-50 transition-colors duration-150">
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.type)}`}>
                              {getMovementTypeLabel(movement.type)}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900">
                            {movement.empty_items?.name || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-emerald-600 font-semibold">{movement.quantity} units</TableCell>
                          <TableCell className="text-sm text-neutral-600">
                            {formatDate(movement.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600">
                            {movement.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filteredMovements.length === 0 ? (
                  <div className="text-center text-neutral-600 py-12">
                    <Package className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                    <p className="font-medium">
                      {dateRange !== 'all' ? 'No transactions in the selected period' : 'No transactions yet'}
                    </p>
                  </div>
                ) : (
                  filteredMovements.map((movement) => (
                    <MovementMobileCard key={movement.id} movement={movement} />
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Empties from Manufacturer</DialogTitle>
            <DialogDescription>
              Record empties received with full drink delivery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="receive-empty-item">Empty Item Type</Label>
              <Select
                value={receiveFormData.empty_item_id}
                onValueChange={(value) =>
                  setReceiveFormData({ ...receiveFormData, empty_item_id: value })
                }
              >
                <SelectTrigger id="receive-empty-item">
                  <SelectValue placeholder="Select empty item" />
                </SelectTrigger>
                <SelectContent>
                  {emptyItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (₦{item.deposit_value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receive-quantity">Quantity</Label>
              <Input
                id="receive-quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={receiveFormData.quantity}
                onChange={(e) =>
                  setReceiveFormData({ ...receiveFormData, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receive-notes">Notes (Optional)</Label>
              <Textarea
                id="receive-notes"
                placeholder="Additional information..."
                value={receiveFormData.notes}
                onChange={(e) =>
                  setReceiveFormData({ ...receiveFormData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleReceiveSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? 'Recording...' : 'Receive Empties'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Empties to Manufacturer</DialogTitle>
            <DialogDescription>
              Record empties returned when buying new drinks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="return-empty-item">Empty Item Type</Label>
              <Select
                value={returnFormData.empty_item_id}
                onValueChange={(value) =>
                  setReturnFormData({ ...returnFormData, empty_item_id: value })
                }
              >
                <SelectTrigger id="return-empty-item">
                  <SelectValue placeholder="Select empty item" />
                </SelectTrigger>
                <SelectContent>
                  {emptyItems.map((item) => {
                    const inventory = warehouseInventory.find(
                      (inv) => inv.empty_item_id === item.id
                    )
                    const available = inventory?.quantity_available || 0
                    return (
                      <SelectItem 
                        key={item.id} 
                        value={item.id}
                        disabled={available === 0}
                      >
                        {item.name} ({available} available)
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-quantity">Quantity</Label>
              <Input
                id="return-quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={returnFormData.quantity}
                onChange={(e) =>
                  setReturnFormData({ ...returnFormData, quantity: e.target.value })
                }
              />
              {returnFormData.empty_item_id && (
                <p className="text-sm text-muted-foreground">
                  Available:{' '}
                  {warehouseInventory.find(
                    (inv) => inv.empty_item_id === returnFormData.empty_item_id
                  )?.quantity_available || 0}{' '}
                  units
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-notes">Notes (Optional)</Label>
              <Textarea
                id="return-notes"
                placeholder="Additional information..."
                value={returnFormData.notes}
                onChange={(e) =>
                  setReturnFormData({ ...returnFormData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleReturnSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? 'Recording...' : 'Return Empties'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
