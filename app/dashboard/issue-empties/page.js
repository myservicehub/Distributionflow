'use client'

import { useState, useEffect, useMemo } from 'react'
import { Package, Users, Send, AlertCircle, History, Eye, ChevronDown, ChevronUp, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { DateRangeFilter, getDateRangeStart } from '@/components/ui/date-range-filter'

// Mobile Card Component for Warehouse Inventory
function WarehouseInventoryMobileCard({ inv, emptyItem, onViewHistory }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">
                  {emptyItem?.name || 'Unknown'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500">Available in warehouse</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-2xl font-bold text-emerald-600">
                {inv.quantity_available}
              </p>
              <p className="text-xs text-neutral-500">units</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <span className="text-sm text-neutral-600">Total Value:</span>
            <span className="font-bold text-emerald-600">
              ₦{parseFloat(inv.quantity_available * (emptyItem?.deposit_value || 0)).toLocaleString()}
            </span>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Deposit Value:</span>
                <span className="font-medium text-neutral-900">
                  ₦{parseFloat(emptyItem?.deposit_value || 0).toLocaleString()}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewHistory(inv.empty_item_id)}
                className="w-full border-2 hover:border-emerald-500 hover:text-emerald-600"
              >
                <History className="h-4 w-4 mr-1" />
                View Movement History
              </Button>
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

export default function IssueEmptiesPage() {
  const { userProfile } = useAuth()
  const [retailers, setRetailers] = useState([])
  const [emptyItems, setEmptyItems] = useState([])
  const [warehouseInventory, setWarehouseInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [viewingHistory, setViewingHistory] = useState(null)
  const [movements, setMovements] = useState([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [dateRange, setDateRange] = useState('30d')
  
  const [formData, setFormData] = useState({
    retailer_id: '',
    empty_item_id: '',
    quantity: '',
    notes: ''
  })

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
    if (dateRange === 'all') return movements
    const start = getDateRangeStart(dateRange)
    if (!start) return movements
    return movements.filter(m => new Date(m.created_at) >= start)
  }, [movements, dateRange])

  useEffect(() => {
    const controller = new AbortController()
    
    loadData(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadData = async (signal) => {
    try {
      // Load retailers
      const retailersRes = await fetch('/api/retailers', { signal })
      if (retailersRes.ok) {
        const retailersResponseData = await retailersRes.json()
        // Handle both old format (array) and new format (object with data property)
        const retailersData = Array.isArray(retailersResponseData) ? retailersResponseData : (retailersResponseData.data || [])
        setRetailers(retailersData)
      }

      // Load empty items
      const emptyRes = await fetch('/api/empty-bottles?route=empty-items')
      if (emptyRes.ok) {
        const emptyResponseData = await emptyRes.json()
        // Handle both old format (array) and new format (object with data property)
        const emptyData = Array.isArray(emptyResponseData) ? emptyResponseData : (emptyResponseData.data || [])
        setEmptyItems(emptyData)
      }

      // Load warehouse inventory
      const inventoryRes = await fetch('/api/empty-bottles?route=warehouse-empty-inventory')
      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json()
        setWarehouseInventory(inventoryData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.retailer_id || !formData.empty_item_id || !formData.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    const quantity = parseInt(formData.quantity)
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    // Check warehouse inventory
    const inventory = warehouseInventory.find(
      inv => inv.empty_item_id === formData.empty_item_id
    )
    
    if (!inventory || inventory.quantity_available < quantity) {
      toast.error(`Insufficient warehouse inventory. Available: ${inventory?.quantity_available || 0}`)
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'issue-to-retailer',
          retailer_id: formData.retailer_id,
          empty_item_id: formData.empty_item_id,
          quantity: quantity,
          notes: formData.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to issue empties')
      }

      const retailer = retailers.find(r => r.id === formData.retailer_id)
      const emptyItem = emptyItems.find(e => e.id === formData.empty_item_id)
      
      toast.success(`Successfully issued ${quantity} ${emptyItem?.name} to ${retailer?.shop_name}`)
      
      setShowDialog(false)
      setFormData({ retailer_id: '', empty_item_id: '', quantity: '', notes: '' })
      loadData() // Reload data to update inventory
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const loadMovements = async (emptyItemId) => {
    setLoadingMovements(true)
    setViewingHistory(emptyItemId)
    
    try {
      const response = await fetch(`/api/empty-bottles?route=empty-movements&empty_item_id=${emptyItemId}`)
      if (!response.ok) throw new Error('Failed to load movements')
      
      const data = await response.json()
      setMovements(data)
    } catch (error) {
      console.error('Error loading movements:', error)
      toast.error('Failed to load movement history')
      setMovements([])
    } finally {
      setLoadingMovements(false)
    }
  }

  const getMovementTypeLabel = (type) => {
    const labels = {
      'manufacturer_in': 'Received from Manufacturer',
      'returned_from_retailer': 'Returned by Retailer',
      'issued_to_retailer': 'Issued to Retailer',
      'returned_to_manufacturer': 'Returned to Manufacturer',
      'bottle_exchange': 'Bottle Exchange'
    }
    return labels[type] || type
  }

  const getMovementTypeColor = (type) => {
    if (type === 'manufacturer_in' || type === 'returned_from_retailer' || type === 'bottle_exchange') {
      return 'bg-green-100 text-green-700'
    }
    if (type === 'issued_to_retailer' || type === 'returned_to_manufacturer') {
      return 'bg-blue-100 text-blue-700'
    }
    return 'bg-gray-100 text-gray-700'
  }


  const selectedInventory = warehouseInventory.find(
    inv => inv.empty_item_id === formData.empty_item_id
  )

  const selectedEmptyItem = emptyItems.find(e => e.id === formData.empty_item_id)
  const selectedRetailer = retailers.find(r => r.id === formData.retailer_id)

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading...</p>
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
            <CardDescription>Only admin, managers, and warehouse staff can issue empties.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Issue Empties to Retailers</h1>
          <p className="text-neutral-600 mt-2">
            Record when retailers take empty bottles from your warehouse
          </p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)} 
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg w-full sm:w-auto"
        >
          <Send className="h-5 w-5 mr-2" />
          Issue Empties
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="border-2 border-emerald-200 bg-emerald-50">
        <AlertCircle className="h-5 w-5 text-emerald-600" />
        <AlertDescription className="text-emerald-900">
          <strong>When to use this:</strong> When you deliver products to retailers and they take empty bottles 
          with them. This will increase their balance (they owe you empties) and decrease your warehouse inventory.
        </AlertDescription>
      </Alert>

      {/* Workflow Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retailers</CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{retailers.length}</div>
            <p className="text-xs text-neutral-500 mt-1">Active retailers</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empty Items</CardTitle>
            <Package className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{emptyItems.length}</div>
            <p className="text-xs text-neutral-500 mt-1">Types available</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all sm:col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Warehouse</CardTitle>
            <Package className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {warehouseInventory.reduce((sum, inv) => sum + (inv.quantity_available || 0), 0)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Units available</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Guide */}
      <Card className="border-2 border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="text-neutral-900">How It Works</CardTitle>
          <CardDescription>The empty bottle workflow when retailers take empties</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-lg">
                1
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Select Retailer & Empty Item</p>
                <p className="text-sm text-neutral-600">Choose which retailer is taking empties and what type</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-lg">
                2
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Enter Quantity</p>
                <p className="text-sm text-neutral-600">How many empty bottles are they taking?</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-lg">
                3
              </div>
              <div>
                <p className="font-semibold text-neutral-900">System Updates Automatically</p>
                <p className="text-sm text-neutral-600">
                  ✓ Warehouse inventory decreases<br/>
                  ✓ Retailer balance increases (they owe you)<br/>
                  ✓ Movement is logged for tracking
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Inventory */}
      {/* Date Range Filter for Movement History */}
      <Card className="border-2 border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-900">Movement History Filter:</p>
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <p className="text-xs text-emerald-700">
              When you click "View History", you'll see movements from {rangeLabel.toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4 animate-fade-in">
        {warehouseInventory.length === 0 ? (
          <Card className="border-2 border-neutral-200">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-xl font-bold text-neutral-900">Warehouse Empty Inventory</CardTitle>
              </div>
              <CardDescription>Current stock and movement history</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Package className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">No empties in warehouse</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Warehouse Inventory ({warehouseInventory.length})</h3>
            </div>
            {warehouseInventory.map((inv) => {
              const emptyItem = emptyItems.find(e => e.id === inv.empty_item_id)
              return (
                <WarehouseInventoryMobileCard
                  key={inv.id}
                  inv={inv}
                  emptyItem={emptyItem}
                  onViewHistory={loadMovements}
                />
              )
            })}
          </>
        )}
      </div>

      {/* Desktop View - Table Layout */}
      <Card className="hidden md:block border-2 border-neutral-200 shadow-lg">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="text-neutral-900">Warehouse Empty Inventory</CardTitle>
          <CardDescription>Current stock and movement history</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold">Empty Item</TableHead>
                  <TableHead className="text-right font-semibold">Available Quantity</TableHead>
                  <TableHead className="text-right font-semibold">Deposit Value</TableHead>
                  <TableHead className="text-right font-semibold">Total Value</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-600 py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                        <Package className="h-8 w-8 text-neutral-400" />
                      </div>
                      <p className="font-medium">No empties in warehouse</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouseInventory.map((inv) => {
                    const emptyItem = emptyItems.find(e => e.id === inv.empty_item_id)
                    return (
                      <TableRow key={inv.id} className="hover:bg-emerald-50 transition-colors duration-150">
                        <TableCell className="font-medium text-neutral-900">
                          {emptyItem?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-2xl font-bold text-emerald-600">
                            {inv.quantity_available}
                          </span>
                          <span className="text-sm text-neutral-600 ml-1">units</span>
                        </TableCell>
                        <TableCell className="text-right text-neutral-900">
                          ₦{parseFloat(emptyItem?.deposit_value || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          ₦{parseFloat(inv.quantity_available * (emptyItem?.deposit_value || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => loadMovements(inv.empty_item_id)}
                            className="border-2 hover:border-emerald-500 hover:text-emerald-600"
                          >
                            <History className="h-3 w-3 mr-1" />
                            View History
                          </Button>
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

      {/* Issue Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Empties to Retailer</DialogTitle>
            <DialogDescription>
              Record when a retailer takes empty bottles from your warehouse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Retailer Selection */}
            <div className="space-y-2">
              <Label htmlFor="retailer">Retailer *</Label>
              <Select
                value={formData.retailer_id}
                onValueChange={(value) => setFormData({ ...formData, retailer_id: value })}
              >
                <SelectTrigger id="retailer">
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map((retailer) => (
                    <SelectItem key={retailer.id} value={retailer.id}>
                      {retailer.shop_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empty Item Selection */}
            <div className="space-y-2">
              <Label htmlFor="empty-item">Empty Item *</Label>
              <Select
                value={formData.empty_item_id}
                onValueChange={(value) => setFormData({ ...formData, empty_item_id: value })}
              >
                <SelectTrigger id="empty-item">
                  <SelectValue placeholder="Select empty item" />
                </SelectTrigger>
                <SelectContent>
                  {emptyItems.map((item) => {
                    const inventory = warehouseInventory.find(inv => inv.empty_item_id === item.id)
                    return (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (Available: {inventory?.quantity_available || 0})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedInventory && (
                <p className="text-xs text-muted-foreground">
                  Warehouse has {selectedInventory.quantity_available} units available
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedInventory?.quantity_available || 0}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Delivery order #1234"
              />
            </div>

            {/* Summary */}
            {formData.retailer_id && formData.empty_item_id && formData.quantity && (
              <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-emerald-900">Summary:</p>
                <p className="text-sm text-emerald-900">
                  Issue <strong>{formData.quantity}</strong> × {selectedEmptyItem?.name} to{' '}
                  <strong>{selectedRetailer?.shop_name}</strong>
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  ✓ Warehouse: {selectedInventory?.quantity_available || 0} → {(selectedInventory?.quantity_available || 0) - parseInt(formData.quantity || 0)}<br/>
                  ✓ Retailer will owe: +{formData.quantity} units
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={processing}>
              {processing ? 'Processing...' : 'Issue Empties'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement History Dialog */}
      <Dialog open={!!viewingHistory} onOpenChange={() => setViewingHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Movement History - {emptyItems.find(e => e.id === viewingHistory)?.name}
            </DialogTitle>
            <DialogDescription>
              Complete history of how this empty item entered and left your warehouse
            </DialogDescription>
          </DialogHeader>
          
          {loadingMovements ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading movement history...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Received</p>
                      <p className="text-2xl font-bold text-green-600">
                        {movements.filter(m => m.type === 'manufacturer_in' || m.type === 'returned_from_retailer').reduce((sum, m) => sum + m.quantity, 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Issued</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {movements.filter(m => m.type === 'issued_to_retailer' || m.type === 'returned_to_manufacturer').reduce((sum, m) => sum + m.quantity, 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {warehouseInventory.find(inv => inv.empty_item_id === viewingHistory)?.quantity_available || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Movements Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No movements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-sm">
                            {new Date(movement.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMovementTypeColor(movement.type)}>
                              {getMovementTypeLabel(movement.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold ${
                              movement.type === 'manufacturer_in' || movement.type === 'returned_from_retailer' 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                            }`}>
                              {movement.type === 'manufacturer_in' || movement.type === 'returned_from_retailer' ? '+' : '-'}
                              {movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {movement.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Legend */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Understanding the Sources:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">+</span>
                    <strong>Received from Manufacturer:</strong> When you buy drinks, empties come with them
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">+</span>
                    <strong>Returned by Retailer:</strong> Retailers bring empties back to you
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">-</span>
                    <strong>Issued to Retailer:</strong> You gave empties to retailer (they owe you)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">-</span>
                    <strong>Returned to Manufacturer:</strong> You returned empties when buying new drinks
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingHistory(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
