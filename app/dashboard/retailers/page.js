'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function RetailersPage() {
  const [retailers, setRetailers] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRetailer, setEditingRetailer] = useState(null)
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    address: '',
    assigned_rep_id: '',
    credit_limit: '0',
    status: 'active'
  })
  const supabase = createClient()

  useEffect(() => {
    loadRetailers()
    loadStaff()
  }, [])

  const loadRetailers = async () => {
    try {
      const response = await fetch('/api/retailers')
      if (!response.ok) throw new Error('Failed to load retailers')
      const data = await response.json()
      setRetailers(data)
    } catch (error) {
      toast.error('Failed to load retailers')
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (!response.ok) throw new Error('Failed to load staff')
      const data = await response.json()
      setStaff(data.filter(s => s.role === 'sales_rep' || s.role === 'admin'))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingRetailer ? `/api/retailers/${editingRetailer.id}` : '/api/retailers'
      const method = editingRetailer ? 'PUT' : 'POST'
      
      // Prepare data - convert "none" to empty string for assigned_rep_id
      const submitData = {
        ...formData,
        assigned_rep_id: formData.assigned_rep_id === 'none' || formData.assigned_rep_id === '' 
          ? '' 
          : formData.assigned_rep_id
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save retailer')
      }

      toast.success(editingRetailer ? 'Retailer updated!' : 'Retailer created!')
      setDialogOpen(false)
      resetForm()
      loadRetailers()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleEdit = (retailer) => {
    setEditingRetailer(retailer)
    setFormData({
      shop_name: retailer.shop_name,
      owner_name: retailer.owner_name || '',
      phone: retailer.phone || '',
      address: retailer.address || '',
      assigned_rep_id: retailer.assigned_rep_id || '',
      credit_limit: retailer.credit_limit?.toString() || '0',
      status: retailer.status
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this retailer?')) return

    try {
      const response = await fetch(`/api/retailers/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete retailer')

      toast.success('Retailer deleted!')
      loadRetailers()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      shop_name: '',
      owner_name: '',
      phone: '',
      address: '',
      assigned_rep_id: '',
      credit_limit: '0',
      status: 'active'
    })
    setEditingRetailer(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Retailers</h2>
          <p className="text-gray-600 mt-2">Manage your retail customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Retailer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRetailer ? 'Edit Retailer' : 'Add New Retailer'}</DialogTitle>
              <DialogDescription>
                {editingRetailer ? 'Update retailer information' : 'Create a new retail customer'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="shop_name">Shop Name *</Label>
                <Input
                  id="shop_name"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="owner_name">Owner Name</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="assigned_rep_id">Assigned Sales Rep</Label>
                <Select
                  value={formData.assigned_rep_id}
                  onValueChange={(value) => setFormData({ ...formData, assigned_rep_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No assignment</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="credit_limit">Credit Limit (₦)</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                />
              </div>
              {editingRetailer && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full">
                {editingRetailer ? 'Update' : 'Create'} Retailer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Retailers ({retailers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retailers.map((retailer) => (
                  <TableRow key={retailer.id}>
                    <TableCell className="font-medium">{retailer.shop_name}</TableCell>
                    <TableCell>{retailer.owner_name || '-'}</TableCell>
                    <TableCell>{retailer.phone || '-'}</TableCell>
                    <TableCell>{retailer.users?.name || 'Unassigned'}</TableCell>
                    <TableCell>₦{parseFloat(retailer.credit_limit || 0).toLocaleString()}</TableCell>
                    <TableCell className={parseFloat(retailer.current_balance) > parseFloat(retailer.credit_limit) ? 'text-red-600 font-semibold' : ''}>
                      ₦{parseFloat(retailer.current_balance || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={retailer.status === 'active' ? 'default' : 'destructive'}>
                        {retailer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(retailer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(retailer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {retailers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No retailers yet. Click "Add Retailer" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
