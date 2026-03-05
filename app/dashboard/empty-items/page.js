'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

export default function EmptyItemsPage() {
  const { userProfile } = useAuth()
  const [emptyItems, setEmptyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({ name: '', deposit_value: '', initial_quantity: '0' })

  useEffect(() => {
    loadEmptyItems()
  }, [])

  const loadEmptyItems = async () => {
    try {
      const response = await fetch('/api/empty-bottles?route=empty-items')
      if (!response.ok) throw new Error('Failed to load empty items')
      const data = await response.json()
      setEmptyItems(data)
    } catch (error) {
      toast.error('Failed to load empty items')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.deposit_value) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'create-empty-item',
          name: formData.name,
          deposit_value: parseFloat(formData.deposit_value),
          initial_quantity: parseInt(formData.initial_quantity) || 0
        })
      })

      if (!response.ok) throw new Error('Failed to create empty item')

      const data = await response.json()
      
      // Show success message with quantity info
      if (parseInt(formData.initial_quantity) > 0) {
        toast.success(`Empty item created with ${formData.initial_quantity} units in warehouse`)
      } else {
        toast.success('Empty item created successfully')
      }
      
      setShowDialog(false)
      setFormData({ name: '', deposit_value: '', initial_quantity: '0' })
      loadEmptyItems()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  if (!['admin', 'manager'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admin and managers can manage empty items.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empty Items</h1>
          <p className="text-muted-foreground">Manage returnable empty items (crates, bottles, etc.)</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Empty Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empty Items List</CardTitle>
          <CardDescription>All returnable items in your inventory system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : emptyItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No empty items found. Create your first empty item.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Deposit Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emptyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.deposit_value)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Empty Item</DialogTitle>
            <DialogDescription>
              Create a new returnable empty item (e.g., Crate, Bottle, Keg)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Empty Crate, Empty Bottle"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit Value (₦) *</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="0.00"
                value={formData.deposit_value}
                onChange={(e) => setFormData({ ...formData, deposit_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_quantity">Initial Quantity (Optional)</Label>
              <Input
                id="initial_quantity"
                type="number"
                placeholder="0"
                value={formData.initial_quantity}
                onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Add initial stock to warehouse. Leave as 0 to add stock later via Manufacturer Supply.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
