'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Store, User, Phone, CreditCard, DollarSign, Search } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

// Mobile Card Component with View More
function RetailerMobileCard({ retailer, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isOverLimit = parseFloat(retailer.current_balance) > parseFloat(retailer.credit_limit)

  return (
    <Card className="border-2 border-neutral-200 hover:border-primary-200 transition-all">
      <CardContent className="p-4">
        {/* Always Visible Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-primary-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{retailer.shop_name}</h3>
              </div>
              <p className="text-sm text-neutral-600">{retailer.owner_name || 'No owner'}</p>
            </div>
            <Badge variant={retailer.status === 'active' ? 'default' : 'destructive'} className="font-medium flex-shrink-0">
              {retailer.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-y border-neutral-200">
            <div>
              <p className="text-xs text-neutral-500">Current Balance</p>
              <p className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-neutral-900'}`}>
                ₦{parseFloat(retailer.current_balance || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Credit Limit</p>
              <p className="font-semibold text-neutral-700">
                ₦{parseFloat(retailer.credit_limit || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expandable Section */}
          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">Phone:</span>
                <span className="font-medium text-neutral-900">{retailer.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">Assigned Rep:</span>
                <span className="font-medium text-neutral-900">{retailer.users?.name || 'Unassigned'}</span>
              </div>
              {isOverLimit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-800">
                    ⚠️ Over credit limit by ₦{(parseFloat(retailer.current_balance) - parseFloat(retailer.credit_limit)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 hover:bg-primary-50"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View More
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(retailer)}
              className="hover:bg-primary-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(retailer.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRetailer, setEditingRetailer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    assigned_rep_id: '',
    credit_limit: '0',
    status: 'active'
  })
  const supabase = createClient()

  useEffect(() => {
    const controller = new AbortController()
    
    loadRetailers(controller.signal)
    loadStaff(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadRetailers = async (signal) => {
    try {
      const response = await fetch('/api/retailers', { signal })
      if (!response.ok) throw new Error('Failed to load retailers')
      const data = await response.json()
      setRetailers(Array.isArray(data) ? data : [])
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading retailers:', error)
        toast.error('Failed to load retailers')
      }
      setRetailers([])
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async (signal) => {
    try {
      const response = await fetch('/api/staff', { signal })
      if (!response.ok) throw new Error('Failed to load staff')
      const data = await response.json()
      // Only show sales reps in the assignment dropdown
      setStaff(Array.isArray(data) ? data.filter(s => s.role === 'sales_rep') : [])
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading staff:', error)
      }
      setStaff([])
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
      email: retailer.email || '',
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
      email: '',
      address: '',
      assigned_rep_id: '',
      credit_limit: '0',
      status: 'active'
    })
    setEditingRetailer(null)
  }

  // Filter retailers based on search term
  const filteredRetailers = useMemo(() => {
    if (!searchTerm) return retailers

    const lowerSearch = searchTerm.toLowerCase()
    return retailers.filter(retailer =>
      retailer.shop_name?.toLowerCase().includes(lowerSearch) ||
      retailer.owner_name?.toLowerCase().includes(lowerSearch) ||
      retailer.phone?.toLowerCase().includes(lowerSearch) ||
      retailer.email?.toLowerCase().includes(lowerSearch) ||
      retailer.users?.name?.toLowerCase().includes(lowerSearch)
    )
  }, [retailers, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredRetailers.length / pageSize)
  const paginatedRetailers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRetailers.slice(startIndex, startIndex + pageSize)
  }, [filteredRetailers, currentPage, pageSize])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" role="status" aria-label="Loading"><span className="sr-only">Loading...</span></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-slide-down">
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Retailers</h2>
          <p className="text-neutral-600 mt-2">Manage your retail customers and credit limits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group h-12">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
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
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="retailer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-neutral-500 mt-1">Used for sending invoices and receipts</p>
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

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by shop name, owner, phone, email, or assigned rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-2"
          />
        </div>
      </div>

      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <CardTitle className="text-2xl font-bold text-neutral-900">All Retailers ({filteredRetailers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table aria-label="Data table">
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold">Shop Name</TableHead>
                  <TableHead className="font-semibold">Owner</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Assigned Rep</TableHead>
                  <TableHead className="font-semibold">Credit Limit</TableHead>
                  <TableHead className="font-semibold">Current Balance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRetailers.map((retailer) => (
                  <TableRow key={retailer.id} className="hover:bg-neutral-50 transition-colors duration-150">
                    <TableCell className="font-medium text-neutral-900">{retailer.shop_name}</TableCell>
                    <TableCell className="text-neutral-700">{retailer.owner_name || '-'}</TableCell>
                    <TableCell className="text-neutral-700">{retailer.phone || '-'}</TableCell>
                    <TableCell className="text-neutral-700">{retailer.users?.name || 'Unassigned'}</TableCell>
                    <TableCell className="text-neutral-900 font-medium">₦{parseFloat(retailer.credit_limit || 0).toLocaleString()}</TableCell>
                    <TableCell className={parseFloat(retailer.current_balance) > parseFloat(retailer.credit_limit) ? 'text-red-600 font-semibold' : 'text-neutral-900 font-medium'}>
                      ₦{parseFloat(retailer.current_balance || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={retailer.status === 'active' ? 'default' : 'destructive'} className="font-medium">
                        {retailer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(retailer)} className="hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700">
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
            {filteredRetailers.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Store className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching retailers' : 'No retailers yet'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Click "Add Retailer" to create your first retail customer'}
                </p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="p-4 border-t border-neutral-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredRetailers.length}
                  pageSize={pageSize}
                />
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredRetailers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Store className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching retailers' : 'No retailers yet'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Click "Add Retailer" to create your first retail customer'}
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {paginatedRetailers.map((retailer) => (
                    <RetailerMobileCard 
                      key={retailer.id} 
                      retailer={retailer} 
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="p-4 border-t border-neutral-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={filteredRetailers.length}
                      pageSize={pageSize}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
