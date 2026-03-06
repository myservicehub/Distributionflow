'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
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
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadEmptyItems(),
      loadWarehouseInventory(),
      loadRecentMovements()
    ])
    setDataLoading(false)
  }

  const loadEmptyItems = async () => {
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

  const loadWarehouseInventory = async () => {
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

  const loadRecentMovements = async () => {
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

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manufacturer Supply Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage empties received from and returned to manufacturer
        </p>
      </div>

      {/* Tabs for Receive and Return */}
      <Tabs defaultValue="receive" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="receive" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Receive Empties
          </TabsTrigger>
          <TabsTrigger value="return" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Return Empties
          </TabsTrigger>
        </TabsList>

        {/* Receive Tab */}
        <TabsContent value="receive" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Receive Empties from Manufacturer</CardTitle>
                  <CardDescription>
                    Record empties received when manufacturer delivers full drinks
                  </CardDescription>
                </div>
                <Button onClick={() => setShowReceiveDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Receive Empties
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empty Item</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Deposit Value</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No inventory yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      warehouseInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.empty_items?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>{item.quantity_available} units</TableCell>
                          <TableCell>
                            {formatCurrency(item.empty_items?.deposit_value || 0)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(
                              item.quantity_available * (item.empty_items?.deposit_value || 0)
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Return Tab */}
        <TabsContent value="return" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Return Empties to Manufacturer</CardTitle>
                  <CardDescription>
                    Record empties returned when purchasing new drinks
                  </CardDescription>
                </div>
                <Button onClick={() => setShowReturnDialog(true)}>
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Return Empties
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empty Item</TableHead>
                      <TableHead>Available to Return</TableHead>
                      <TableHead>Deposit Value</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No empties available to return
                        </TableCell>
                      </TableRow>
                    ) : (
                      warehouseInventory
                        .filter((item) => item.quantity_available > 0)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.empty_items?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>{item.quantity_available} units</TableCell>
                            <TableCell>
                              {formatCurrency(item.empty_items?.deposit_value || 0)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(
                                item.quantity_available * (item.empty_items?.deposit_value || 0)
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Manufacturer Transactions</CardTitle>
          <CardDescription>History of empties received from and returned to manufacturer</CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Empty Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.type)}`}>
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.empty_items?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{movement.quantity} units</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(movement.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceiveSubmit} disabled={loading}>
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
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturnSubmit} disabled={loading}>
              {loading ? 'Recording...' : 'Return Empties'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
