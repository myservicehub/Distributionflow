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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
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

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      deposit_value: item.deposit_value,
      initial_quantity: '0'
    })
    setShowDialog(true)
  }

  const handleUpdate = async () => {
    if (!formData.name || !formData.deposit_value) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'update-empty-item',
          id: editingItem.id,
          name: formData.name,
          deposit_value: parseFloat(formData.deposit_value)
        })
      })

      if (!response.ok) throw new Error('Failed to update empty item')

      toast.success('Empty item updated successfully')
      setShowDialog(false)
      setEditingItem(null)
      setFormData({ name: '', deposit_value: '', initial_quantity: '0' })
      loadEmptyItems()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteClick = (item) => {
    setDeletingItem(item)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'delete-empty-item',
          id: deletingItem.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete empty item')
      }

      toast.success('Empty item deleted successfully')
      setShowDeleteDialog(false)
      setDeletingItem(null)
      loadEmptyItems()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    setEditingItem(null)
    setFormData({ name: '', deposit_value: '', initial_quantity: '0' })
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Empty Item' : 'Add Empty Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update empty item details' : 'Create a new returnable empty item (e.g., Crate, Bottle, Keg)'}
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
            {!editingItem && (
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdate : handleCreate}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Empty Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This empty item will be permanently deleted.
            </p>
            {deletingItem && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{deletingItem.name}</p>
                <p className="text-sm text-muted-foreground">Deposit Value: {formatCurrency(deletingItem.deposit_value)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

