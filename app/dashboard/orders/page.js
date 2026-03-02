'use client'

import React, { useEffect, useState } from 'react'
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
import { Plus, Eye, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function OrdersPage() {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [retailers, setRetailers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }])
  const [formData, setFormData] = useState({
    retailer_id: '',
    payment_status: 'paid'
  })
  const supabase = createClient()

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  useEffect(() => {
    loadOrders()
    loadRetailers()
    loadProducts()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to load orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const loadRetailers = async () => {
    try {
      const response = await fetch('/api/retailers')
      if (!response.ok) throw new Error('Failed to load retailers')
      const data = await response.json()
      setRetailers(data.filter(r => r.status === 'active'))
    } catch (error) {
      console.error(error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to load products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error(error)
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

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: formData.retailer_id,
          payment_status: formData.payment_status,
          total_amount: calculateTotal(),
          items: orderItems
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create order')
      }

      toast.success('Order created successfully!')
      setDialogOpen(false)
      resetForm()
      loadOrders()
      loadProducts() // Reload to update stock
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({ retailer_id: '', payment_status: 'paid' })
    setOrderItems([{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }])
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
        body: JSON.stringify({ status: 'confirmed' })
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
        body: JSON.stringify({ status: 'cancelled' })
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

  const canApproveOrders = () => {
    return userProfile && ['admin', 'manager'].includes(userProfile.role)
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
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-600 mt-2">Manage customer orders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
                              {p.name} (Stock: {p.stock_quantity})
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

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <Button type="submit" className="w-full">Create Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Date</TableHead>
                  {canApproveOrders() && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleOrderExpand(order.id)}
                          className="p-0 h-auto"
                        >
                          {expandedOrders[order.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{order.retailers?.shop_name || 'N/A'}</TableCell>
                      <TableCell>{order.sales_rep?.name || 'Unassigned'}</TableCell>
                      <TableCell className="font-semibold">₦{parseFloat(order.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusColor(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      {canApproveOrders() && (
                        <TableCell>
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleApproveOrder(order.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectOrder(order.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {order.status !== 'pending' && (
                            <span className="text-sm text-muted-foreground">No action needed</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedOrders[order.id] && (
                      <TableRow>
                        <TableCell colSpan={canApproveOrders() ? 9 : 8} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">Order Items</h4>
                            {order.order_items && order.order_items.length > 0 ? (
                              <Table>
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
                                  {order.order_items.map((item, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">
                                        {item.product?.name || 'Unknown Product'}
                                      </TableCell>
                                      <TableCell>{item.product?.sku || '-'}</TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right">₦{parseFloat(item.unit_price).toLocaleString()}</TableCell>
                                      <TableCell className="text-right font-semibold">
                                        ₦{parseFloat(item.total_price).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
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
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders yet. Click "New Order" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
