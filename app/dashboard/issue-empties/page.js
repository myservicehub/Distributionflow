'use client'

import { useState, useEffect } from 'react'
import { Package, Users, Send, AlertCircle } from 'lucide-react'
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

export default function IssueEmptiesPage() {
  const { userProfile } = useAuth()
  const [retailers, setRetailers] = useState([])
  const [emptyItems, setEmptyItems] = useState([])
  const [warehouseInventory, setWarehouseInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  const [formData, setFormData] = useState({
    retailer_id: '',
    empty_item_id: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load retailers
      const retailersRes = await fetch('/api/retailers')
      if (retailersRes.ok) {
        const retailersData = await retailersRes.json()
        setRetailers(retailersData)
      }

      // Load empty items
      const emptyRes = await fetch('/api/empty-bottles?route=empty-items')
      if (emptyRes.ok) {
        const emptyData = await emptyRes.json()
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue Empties to Retailers</h1>
          <p className="text-muted-foreground mt-2">
            Record when retailers take empty bottles from your warehouse
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} size="lg">
          <Send className="h-4 w-4 mr-2" />
          Issue Empties
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>When to use this:</strong> When you deliver products to retailers and they take empty bottles 
          with them. This will increase their balance (they owe you empties) and decrease your warehouse inventory.
        </AlertDescription>
      </Alert>

      {/* Workflow Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retailers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retailers.length}</div>
            <p className="text-xs text-muted-foreground">Active retailers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empty Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emptyItems.length}</div>
            <p className="text-xs text-muted-foreground">Types available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Warehouse</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouseInventory.reduce((sum, inv) => sum + (inv.quantity_available || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Units available</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>The empty bottle workflow when retailers take empties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                1
              </div>
              <div>
                <p className="font-medium">Select Retailer & Empty Item</p>
                <p className="text-sm text-muted-foreground">Choose which retailer is taking empties and what type</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                2
              </div>
              <div>
                <p className="font-medium">Enter Quantity</p>
                <p className="text-sm text-muted-foreground">How many empty bottles are they taking?</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                3
              </div>
              <div>
                <p className="font-medium">System Updates Automatically</p>
                <p className="text-sm text-muted-foreground">
                  ✓ Warehouse inventory decreases<br/>
                  ✓ Retailer balance increases (they owe you)<br/>
                  ✓ Movement is logged for tracking
                </p>
              </div>
            </div>
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
              <div className="bg-primary/10 p-3 rounded-lg space-y-1">
                <p className="text-sm font-medium">Summary:</p>
                <p className="text-sm">
                  Issue <strong>{formData.quantity}</strong> × {selectedEmptyItem?.name} to{' '}
                  <strong>{selectedRetailer?.shop_name}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
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
    </div>
  )
}
