'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { Plus, Eye, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, ShoppingCart, User, Calendar, DollarSign, Search } from 'lucide-react'
import BottleExchangeSection from '@/components/BottleExchangeSection'
import { Pagination } from '@/components/ui/pagination'

// Mobile Card Component for Orders
function OrderMobileCard({ order, onExpand, isExpanded, canApprove, onApprove, onReject, getPaymentStatusColor, getStatusColor }) {
  return (
    <Card className="border-2 border-neutral-200 hover:border-primary-200 transition-all">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-primary-600 flex-shrink-0" />
                <h3 className="font-mono text-sm text-neutral-600">#{order.id.slice(0, 8)}</h3>
              </div>
              <p className="font-bold text-neutral-900 truncate">{order.retailers?.shop_name || 'Unknown Retailer'}</p>
            </div>
            <Badge variant={getStatusColor(order.status)} className="font-medium flex-shrink-0">
              {order.status}
            </Badge>
          </div>

          {/* Amount and Payment Status */}
          <div className="flex items-center justify-between py-2 border-y border-neutral-200">
            <div>
              <p className="text-xs text-neutral-500">Total Amount</p>
              <p className="font-bold text-neutral-900">₦{parseFloat(order.total_amount).toLocaleString()}</p>
            </div>
            <Badge variant={getPaymentStatusColor(order.payment_status)} className="font-medium">
              {order.payment_status}
            </Badge>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">Sales Rep:</span>
                <span className="font-medium text-neutral-900">{order.sales_rep?.name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">Date:</span>
                <span className="font-medium text-neutral-900">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>

              {/* Order Items */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-900 mb-2">Order Items:</p>
                  <div className="space-y-2">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="text-sm bg-neutral-50 rounded-lg p-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-neutral-900">{item.product?.name || 'Unknown'}</span>
                          <span className="text-neutral-600">x{item.quantity}</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          ₦{parseFloat(item.unit_price).toLocaleString()} × {item.quantity} = ₦{parseFloat(item.total_price).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Actions */}
              {canApprove && order.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-success-500 hover:bg-success-600 text-white"
                    onClick={() => onApprove(order.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onReject(order.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* View More Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExpand(order.id)}
            className="w-full hover:bg-primary-50"
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
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrdersPage() {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [retailers, setRetailers] = useState([])
  const [products, setProducts] = useState([])
  const [emptyItems, setEmptyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }])
  const [bottleExchange, setBottleExchange] = useState({ enabled: false, empties: [] })
  const [formData, setFormData] = useState({
    retailer_id: '',
    payment_status: 'paid'
  })
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  useEffect(() => {
    const controller = new AbortController()
    
    loadOrders(controller.signal)
    loadRetailers(controller.signal)
    loadProducts(controller.signal)
    loadEmptyItems(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadOrders = async (signal) => {
    try {
      const response = await fetch('/api/orders', { signal })
      if (!response.ok) throw new Error('Failed to load orders')
      const responseData = await response.json()
      // Handle both old format (array) and new format (object with data property)
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      setOrders(data)
    } catch (error) {
      if (error.name === 'AbortError') return // Component unmounted - normal
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const loadRetailers = async (signal) => {
    try {
      const response = await fetch('/api/retailers', { signal })
      if (!response.ok) throw new Error('Failed to load retailers')
      const responseData = await response.json()
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      setRetailers(data.filter(r => r.status === 'active'))
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error loading retailers:', error)
    }
  }

  const loadProducts = async (signal) => {
    try {
      const response = await fetch('/api/products', { signal })
      if (!response.ok) throw new Error('Failed to load products')
      const responseData = await response.json()
      // Handle both old format (array) and new format (object with data property)
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      setProducts(data)
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error loading products:', error)
      setProducts([])
    }
  }

  const loadEmptyItems = async (signal) => {
    try {
      const response = await fetch('/api/empty-bottles?route=empty-items')
      if (response.ok) {
        const data = await response.json()
        setEmptyItems(data)
      }
    } catch (error) {
      console.error('Failed to load empty items:', error)
    }
  }

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, unit_price: 0, total_price: 0 }])
  }

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems]
    newItems[index][field] = value

    // Auto-fill price when product selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].unit_price = product.selling_price
        newItems[index].total_price = product.selling_price * newItems[index].quantity
      }
    }

    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
    }

    setOrderItems(newItems)
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate items
    if (orderItems.some(item => !item.product_id || item.quantity <= 0)) {
      toast.error('Please fill all order items correctly')
      return
    }

    setSubmitting(true)

    try {
      // Calculate deposit if bottle exchange is enabled
      let depositAmount = 0
      if (bottleExchange.enabled && bottleExchange.empties) {
        const totalProductsWithDeposit = orderItems.reduce((sum, item) => {
          const product = products.find(p => p.id === item.product_id)
          if (product && product.empty_item_id) {
            return sum + parseInt(item.quantity || 0)
          }
          return sum
        }, 0)

        const totalEmpties = bottleExchange.empties.reduce((sum, e) => 
          sum + (e.quantity ? parseInt(e.quantity) : 0), 0
        )

        const shortfall = Math.max(0, totalProductsWithDeposit - totalEmpties)
        
        // Get deposit value from first product with empty
        const productWithEmpty = orderItems.find(item => {
          const product = products.find(p => p.id === item.product_id)
          return product && product.empty_item_id
        })
        
        if (productWithEmpty && shortfall > 0) {
          const product = products.find(p => p.id === productWithEmpty.product_id)
          const empty = emptyItems.find(e => e.id === product.empty_item_id)
          if (empty) {
            depositAmount = shortfall * parseFloat(empty.deposit_value || 0)
          }
        }
      }

      const productsTotal = calculateTotal()
      const orderTotal = productsTotal + depositAmount

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: formData.retailer_id,
          payment_status: formData.payment_status,
          total_amount: orderTotal, // Include deposit in total
          items: orderItems,
          bottle_exchange: bottleExchange.enabled ? {
            ...bottleExchange,
            deposit_amount: depositAmount
          } : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Part 4: Handle duplicate order error (double-submit guard)
        if (response.status === 409) {
          toast.error(error.message || error.error, {
            description: 'Please wait a moment if this was intentional'
          })
          return
        }
        
        throw new Error(error.error || 'Failed to create order')
      }

      toast.success('Order created successfully!')
      if (bottleExchange.enabled) {
        const totalEmpties = bottleExchange.empties.reduce((sum, e) => sum + (parseInt(e.quantity) || 0), 0)
        toast.info(`Recorded ${totalEmpties} empties brought by customer`)
        if (depositAmount > 0) {
          toast.info(`Deposit charged: ₦${depositAmount.toLocaleString()}`)
        }
      }
      setDialogOpen(false)
      resetForm()
      loadOrders()
      loadProducts() // Reload to update stock
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ retailer_id: '', payment_status: 'paid' })
    setOrderItems([{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }])
    setBottleExchange({ enabled: false, empties: [] })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'delivered': return 'success'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'default'
      case 'credit': return 'destructive'
      case 'partial': return 'secondary'
      default: return 'secondary'
    }
  }

  const handleApproveOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve order')
      }

      toast.success('Order approved successfully!')
      loadOrders()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleRejectOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: 'Rejected by admin' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject order')
      }

      toast.success('Order rejected')
      loadOrders()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders

    const lowerSearch = searchTerm.toLowerCase()
    return orders.filter(order =>
      order.retailers?.shop_name?.toLowerCase().includes(lowerSearch) ||
      order.sales_rep?.name?.toLowerCase().includes(lowerSearch) ||
      order.id?.toLowerCase().includes(lowerSearch)
    )
  }, [orders, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredOrders.slice(startIndex, startIndex + pageSize)
  }, [filteredOrders, currentPage, pageSize])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const canApproveOrders = () => {
    return userProfile && ['admin', 'manager'].includes(userProfile.role)
  }

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
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Orders</h2>
          <p className="text-neutral-600 mt-2">Manage customer orders and track deliveries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group h-12">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Add products and select payment method
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="retailer_id">Retailer *</Label>
                <Select
                  value={formData.retailer_id}
                  onValueChange={(value) => setFormData({ ...formData, retailer_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retailer" />
                  </SelectTrigger>
                  <SelectContent>
                    {retailers.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.shop_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_status">Payment Status *</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label>Order Items</Label>
                  <Button type="button" size="sm" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-end">
                    <div className="col-span-5">
                      <Label>Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {p.sku ? `SKU: ${p.sku} • ` : ''}Stock: {p.stock_quantity}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input value={item.total_price.toFixed(2)} disabled />
                    </div>
                    <div className="col-span-1">
                      {orderItems.length > 1 && (
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Products Total:</span>
                  <span className="font-medium">₦{calculateTotal().toLocaleString()}</span>
                </div>
                
                {bottleExchange.enabled && (() => {
                  const totalProductsWithDeposit = orderItems.reduce((sum, item) => {
                    const product = products.find(p => p.id === item.product_id)
                    if (product && product.empty_item_id) {
                      return sum + parseInt(item.quantity || 0)
                    }
                    return sum
                  }, 0)

                  const totalEmpties = bottleExchange.empties.reduce((sum, e) => 
                    sum + (e.quantity ? parseInt(e.quantity) : 0), 0
                  )

                  const shortfall = Math.max(0, totalProductsWithDeposit - totalEmpties)
                  
                  let depositAmount = 0
                  if (shortfall > 0) {
                    const productWithEmpty = orderItems.find(item => {
                      const product = products.find(p => p.id === item.product_id)
                      return product && product.empty_item_id
                    })
                    
                    if (productWithEmpty) {
                      const product = products.find(p => p.id === productWithEmpty.product_id)
                      const empty = emptyItems.find(e => e.id === product?.empty_item_id)
                      if (empty) {
                        depositAmount = shortfall * parseFloat(empty.deposit_value || 0)
                      }
                    }
                  }

                  if (depositAmount > 0) {
                    return (
                      <>
                        <div className="flex justify-between items-center text-orange-600">
                          <span className="text-sm">+ Bottle Deposit ({shortfall} bottles):</span>
                          <span className="font-medium">₦{depositAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                          <span>Total Amount:</span>
                          <span>₦{(calculateTotal() + depositAmount).toLocaleString()}</span>
                        </div>
                      </>
                    )
                  }
                  return null
                })()} 
                
                {!bottleExchange.enabled && (
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>₦{calculateTotal().toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Bottle Exchange Section */}
              <BottleExchangeSection
                products={orderItems.map(item => ({
                  ...item,
                  empty_item_id: products.find(p => p.id === item.product_id)?.empty_item_id
                }))}
                emptyItems={emptyItems}
                value={bottleExchange}
                onChange={setBottleExchange}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
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
            placeholder="Search by order ID, retailer name, or sales rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-2"
          />
        </div>
      </div>

      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <CardTitle className="text-2xl font-bold text-neutral-900">All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table aria-label="Data table">
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Retailer</TableHead>
                  <TableHead className="font-semibold">Sales Rep</TableHead>
                  <TableHead className="font-semibold">Total Amount</TableHead>
                  <TableHead className="font-semibold">Payment Status</TableHead>
                  <TableHead className="font-semibold">Order Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  {canApproveOrders() && <TableHead className="font-semibold">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow className="cursor-pointer hover:bg-neutral-50 transition-colors duration-150">
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleOrderExpand(order.id)}
                          className="p-1 h-auto hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          {expandedOrders[order.id] ? (
                            <ChevronUp className="h-4 w-4 text-primary-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-neutral-600" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium text-neutral-900">{order.retailers?.shop_name || 'N/A'}</TableCell>
                      <TableCell className="text-neutral-700">{order.sales_rep?.name || 'Unassigned'}</TableCell>
                      <TableCell className="font-semibold text-neutral-900">₦{parseFloat(order.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusColor(order.payment_status)} className="font-medium">
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)} className="font-medium">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-600">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      {canApproveOrders() && (
                        <TableCell>
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-success-500 hover:bg-success-600 text-white h-9"
                                onClick={() => handleApproveOrder(order.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-9"
                                onClick={() => handleRejectOrder(order.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {order.status !== 'pending' && (
                            <span className="text-sm text-neutral-500">No action needed</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedOrders[order.id] && (
                      <TableRow>
                        <TableCell colSpan={canApproveOrders() ? 9 : 8} className="bg-neutral-50 border-t border-neutral-200">
                          <div className="p-6">
                            <h4 className="font-semibold text-lg text-neutral-900 mb-4">Order Items</h4>
                            {order.order_items && order.order_items.length > 0 ? (
                              <Table aria-label="Data table">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.order_items.map((item, idx) => {
                                    const emptyItem = item.product?.empty_item_id ? 
                                      emptyItems.find(e => e.id === item.product.empty_item_id) : null
                                    
                                    return (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">
                                          <div className="flex flex-col gap-2">
                                            <div>
                                              <div>{item.product?.name || 'Unknown Product'}</div>
                                              {item.product?.sku && (
                                                <div className="text-xs text-muted-foreground">
                                                  SKU: {item.product.sku}
                                                </div>
                                              )}
                                            </div>
                                            {/* Empty Details */}
                                            {emptyItem && (
                                              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                  <svg className="h-3 w-3 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                  </svg>
                                                  <span className="font-medium text-blue-900">
                                                    Empties: <span className="text-blue-600 font-bold">{item.quantity}x {emptyItem.name}</span>
                                                  </span>
                                                </div>
                                                <div className="text-blue-700 mt-1 ml-4">
                                                  ₦{parseFloat(emptyItem.deposit_value).toLocaleString()} deposit each • 
                                                  Total: ₦{(item.quantity * parseFloat(emptyItem.deposit_value)).toLocaleString()}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>{item.product?.sku || '-'}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">₦{parseFloat(item.unit_price).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                          ₦{parseFloat(item.total_price).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-sm text-muted-foreground">No items found for this order</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <ShoppingCart className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching orders' : 'No orders yet'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Click "New Order" to create your first order'}
                </p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="p-4 border-t border-neutral-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredOrders.length}
                  pageSize={pageSize}
                />
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <ShoppingCart className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching orders' : 'No orders yet'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Click "New Order" to create your first order'}
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {paginatedOrders.map((order) => (
                    <OrderMobileCard
                      key={order.id}
                      order={order}
                      onExpand={toggleOrderExpand}
                      isExpanded={expandedOrders[order.id]}
                      canApprove={canApproveOrders()}
                      onApprove={handleApproveOrder}
                      onReject={handleRejectOrder}
                      getPaymentStatusColor={getPaymentStatusColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="p-4 border-t border-neutral-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={filteredOrders.length}
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
