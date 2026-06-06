'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Store, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
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

// Mobile Card Component
function EmptyItemMobileCard({ item, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{item.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                }`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(item.deposit_value)}
              </p>
              <p className="text-xs text-neutral-500">Deposit</p>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">Created:</span>
                </div>
                <span className="text-sm font-medium text-neutral-900">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1 border-2"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(item)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
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
        method: 'POST',
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="animate-slide-down space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Empty Items</h1>
          <p className="text-neutral-600 mt-2">Manage returnable empty items (crates, bottles, etc.)</p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg w-full sm:w-auto"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Empty Item
        </Button>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4 animate-fade-in">
        {loading ? (
          <Card className="border-2 border-neutral-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            </CardContent>
          </Card>
        ) : emptyItems.length === 0 ? (
          <Card className="border-2 border-neutral-200">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-xl font-bold text-neutral-900">Empty Items List</CardTitle>
              </div>
              <CardDescription>All returnable items in your inventory system</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Package className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">No empty items found</p>
                <p className="text-neutral-500 text-sm mt-1">Create your first empty item.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Empty Items List ({emptyItems.length})</h3>
            </div>
            {emptyItems.map((item) => (
              <EmptyItemMobileCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </>
        )}
      </div>

      {/* Desktop View - Table Layout */}
      <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-neutral-900">Empty Items List</CardTitle>
              <CardDescription>All returnable items in your inventory system</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : emptyItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                <Package className="h-8 w-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 text-lg font-medium">No empty items found</p>
              <p className="text-neutral-500 text-sm mt-1">Create your first empty item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Deposit Value</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emptyItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-emerald-50 transition-colors duration-150">
                      <TableCell className="font-medium text-neutral-900">{item.name}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">{formatCurrency(item.deposit_value)}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-neutral-700">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="border-2"
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
            </div>
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
            <Button variant="outline" onClick={handleDialogClose} className="border-2">
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdate : handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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

