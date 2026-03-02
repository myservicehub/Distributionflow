'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function DispatchPage() {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to load orders')
      
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkDispatched = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched' })
      })

      if (!response.ok) throw new Error('Failed to update order')
      
      toast.success('Order marked as dispatched!')
      loadOrders()
    } catch (error) {
      toast.error('Failed to update order: ' + error.message)
    }
  }

  const handleMarkDelivered = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      })

      if (!response.ok) throw new Error('Failed to update order')
      
      toast.success('Order marked as delivered!')
      loadOrders()
    } catch (error) {
      toast.error('Failed to update order: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending Approval' },
      confirmed: { variant: 'default', icon: Package, label: 'Ready to Dispatch' },
      dispatched: { variant: 'default', icon: Truck, label: 'Dispatched', className: 'bg-blue-500' },
      delivered: { variant: 'default', icon: CheckCircle, label: 'Delivered', className: 'bg-green-500' },
      cancelled: { variant: 'destructive', icon: AlertCircle, label: 'Cancelled' }
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filterOrders = (status) => {
    return orders.filter(order => order.status === status)
  }

  const confirmedOrders = filterOrders('confirmed')
  const dispatchedOrders = filterOrders('dispatched')
  const deliveredOrders = filterOrders('delivered')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dispatch queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dispatch Management</h1>
        <p className="text-muted-foreground">Manage order fulfillment and deliveries</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Dispatch</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Orders confirmed and ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dispatchedOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently being delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deliveredOrders.filter(o => 
                new Date(o.updated_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Ready to Dispatch ({confirmedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="dispatched">
            In Transit ({dispatchedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered ({deliveredOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Ready to Dispatch */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders Ready for Dispatch</CardTitle>
              <CardDescription>
                Confirmed orders that need to be packaged and dispatched
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No orders ready for dispatch
                      </TableCell>
                    </TableRow>
                  ) : (
                    confirmedOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">
                          {order.retailers?.shop_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.order_items?.length || 0} items
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{parseFloat(order.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleMarkDispatched(order.id)}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Mark Dispatched
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* In Transit */}
        <TabsContent value="dispatched" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders In Transit</CardTitle>
              <CardDescription>
                Orders currently being delivered to retailers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Dispatched</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No orders in transit
                      </TableCell>
                    </TableRow>
                  ) : (
                    dispatchedOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">
                          {order.retailers?.shop_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.order_items?.length || 0} items
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{parseFloat(order.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(order.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleMarkDelivered(order.id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Delivered
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivered */}
        <TabsContent value="delivered" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivered Orders</CardTitle>
              <CardDescription>
                Successfully delivered orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Delivered Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No delivered orders
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveredOrders.slice(0, 20).map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">
                          {order.retailers?.shop_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.order_items?.length || 0} items
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{parseFloat(order.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(order.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
