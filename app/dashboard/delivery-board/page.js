'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Package, Truck, CheckCircle, XCircle, Search, Calendar, User, CreditCard, Eye, FileText } from 'lucide-react'
import BottleExchangeSection from '@/components/BottleExchangeSection'

export default function DeliveryBoardPage() {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('preparing')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionDialog, setActionDialog] = useState(null)
  const [driverName, setDriverName] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [emptyItems, setEmptyItems] = useState([])
  const [bottleExchangeData, setBottleExchangeData] = useState({ enabled: false, empties: [] })
  const [viewingOrderDetails, setViewingOrderDetails] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loadingOrderItems, setLoadingOrderItems] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      loadOrders()
      loadEmptyItems()
      
      // Subscribe to realtime updates
      const subscription = supabase
        .channel('delivery_board_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${userProfile.business_id}`
          },
          (payload) => {
            console.log('Order updated:', payload)
            loadOrders()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [userProfile, selectedTab])

  const loadEmptyItems = async () => {
    try {
      const response = await fetch('/api/empty-bottles?route=empty-items')
      if (!response.ok) throw new Error('Failed to load empty items')
      const data = await response.json()
      setEmptyItems(data.filter(item => item.is_active))
    } catch (error) {
      console.error('Failed to load empty items:', error)
    }
  }

  const loadOrderItems = async (orderId) => {
    setLoadingOrderItems(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order details')
      const data = await response.json()
      setOrderItems(data.items || [])
      setViewingOrderDetails(data)
    } catch (error) {
      console.error('Failed to load order items:', error)
      toast.error('Failed to load order details')
      setOrderItems([])
    } finally {
      setLoadingOrderItems(false)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to load orders')

      console.log('📦 All orders loaded:', data?.length || 0)
      console.log('Sample order:', data?.[0])

      // Filter for orders in the delivery workflow (confirmed or completed)
      const workflowOrders = (data || []).filter(o => {
        console.log(`Order ${o.id?.substring(0, 8)}: order_status=${o.order_status}, delivery_status=${o.delivery_status}, is_legacy=${o.is_legacy_order}`)
        return (o.order_status === 'confirmed' || o.order_status === 'completed') && !o.is_legacy_order
      })

      console.log('✅ Filtered workflow orders:', workflowOrders.length)
      setOrders(workflowOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const filterOrdersByStatus = (deliveryStatus) => {
    return orders.filter(o => o.delivery_status === deliveryStatus)
  }

  const searchFilteredOrders = (orderList) => {
    if (!searchTerm) return orderList
    
    return orderList.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.retailer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sales_rep_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getTabOrders = () => {
    let filtered = []
    switch (selectedTab) {
      case 'preparing':
        filtered = filterOrdersByStatus('preparing')
        break
      case 'packed':
        filtered = filterOrdersByStatus('packed')
        break
      case 'out_for_delivery':
        filtered = filterOrdersByStatus('out_for_delivery')
        break
      case 'delivered':
        filtered = filterOrdersByStatus('delivered')
        break
      default:
        filtered = orders
    }
    
    return searchFilteredOrders(filtered)
  }

  const handleAction = async (order, action) => {
    if (action === 'dispatch') {
      setSelectedOrder(order)
      setActionDialog('dispatch')
      return
    }

    if (action === 'deliver') {
      setSelectedOrder(order)
      setBottleExchangeData({ enabled: false, empties: [] })
      setActionDialog('deliver')
      return
    }

    try {
      const payload = { action }
      
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Action failed')
      }

      toast.success(result.message || 'Order updated successfully')
      loadOrders()
    } catch (error) {
      console.error('Action error:', error)
      toast.error(error.message)
    }
  }

  const handleDispatch = async () => {
    if (!driverName && !vehicleNumber) {
      toast.error('Please provide driver name or vehicle number')
      return
    }

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch',
          driver_name: driverName,
          vehicle_number: vehicleNumber
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Dispatch failed')
      }

      toast.success('Order dispatched successfully')
      setActionDialog(null)
      setSelectedOrder(null)
      setDriverName('')
      setVehicleNumber('')
      loadOrders()
    } catch (error) {
      console.error('Dispatch error:', error)
      toast.error(error.message)
    }
  }

  const handleDeliver = async () => {
    try {
      // First, mark order as delivered
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deliver' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark as delivered')
      }

      // If bottle exchange is enabled, process it
      if (bottleExchangeData.enabled && bottleExchangeData.empties.length > 0) {
        const exchangeResponse = await fetch('/api/empty-bottles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: 'process-bottle-exchange',
            retailer_id: selectedOrder.retailer_id,
            products_purchased: [], // Not needed for delivery board
            empties_brought: bottleExchangeData.empties.map(e => ({
              empty_item_id: e.empty_item_id,
              quantity: parseInt(e.quantity)
            })),
            deposit_amount: 0, // Will be calculated by backend
            notes: `Empties collected during delivery of order #${selectedOrder.id.substring(0, 8)}`
          })
        })

        if (!exchangeResponse.ok) {
          const exchangeError = await exchangeResponse.json()
          console.error('Bottle exchange failed:', exchangeError)
          toast.warning('Order delivered, but bottle exchange failed: ' + exchangeError.error)
        } else {
          toast.success('Order delivered and empties collected successfully!')
        }
      } else {
        toast.success('Order marked as delivered')
      }

      setActionDialog(null)
      setSelectedOrder(null)
      setBottleExchangeData({ enabled: false, empties: [] })
      loadOrders()
    } catch (error) {
      console.error('Delivery error:', error)
      toast.error(error.message)
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'preparing':
        return 'bg-blue-100 text-blue-700'
      case 'packed':
        return 'bg-purple-100 text-purple-700'
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700'
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const OrderCard = ({ order }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              Order #{order.id.substring(0, 8)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {order.retailer_name || 'Unknown Retailer'}
            </p>
          </div>
          <Badge className={getStatusBadgeColor(order.delivery_status)}>
            {order.delivery_status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-3 w-3" />
            <span>{order.sales_rep_name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="h-3 w-3" />
            <span className="font-semibold">₦{parseFloat(order.total_amount).toLocaleString()}</span>
            <Badge variant="outline" className="text-xs">
              {order.payment_status}
            </Badge>
          </div>
          {order.confirmed_at && (
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(order.confirmed_at).toLocaleString()}</span>
            </div>
          )}
          {order.driver_name && (
            <div className="flex items-center gap-2 text-gray-600">
              <Truck className="h-3 w-3" />
              <span>{order.driver_name} • {order.vehicle_number}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {/* View Details Button - Always visible */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => loadOrderItems(order.id)}
            className="w-full"
          >
            <FileText className="h-3 w-3 mr-1" />
            View Order Details
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {order.delivery_status === 'preparing' && (
              <Button size="sm" onClick={() => handleAction(order, 'pack')} className="flex-1">
                <Package className="h-3 w-3 mr-1" />
                Mark as Packed
              </Button>
            )}
            {order.delivery_status === 'packed' && (
              <Button size="sm" onClick={() => handleAction(order, 'dispatch')} className="flex-1">
                <Truck className="h-3 w-3 mr-1" />
                Dispatch
              </Button>
            )}
            {order.delivery_status === 'out_for_delivery' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleAction(order, 'deliver')} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Delivered
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleAction(order, 'fail_delivery')} 
                  className="flex-1"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const tabs = [
    { id: 'preparing', label: 'Preparing', count: filterOrdersByStatus('preparing').length },
    { id: 'packed', label: 'Packed', count: filterOrdersByStatus('packed').length },
    { id: 'out_for_delivery', label: 'Out for Delivery', count: filterOrdersByStatus('out_for_delivery').length },
    { id: 'delivered', label: 'Delivered', count: filterOrdersByStatus('delivered').length }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Board</h1>
        <p className="text-gray-600 mt-1">Track and manage order deliveries</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID, retailer, or sales rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              selectedTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : getTabOrders().length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No orders in this status</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getTabOrders().map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Dispatch Dialog */}
      <Dialog open={actionDialog === 'dispatch'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="driver">Driver Name (Optional)</Label>
              <Input
                id="driver"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
            <div>
              <Label htmlFor="vehicle">Vehicle Number (Optional)</Label>
              <Input
                id="vehicle"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="Enter vehicle number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={handleDispatch}>Dispatch Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliver Dialog with Bottle Exchange */}
      <Dialog open={actionDialog === 'deliver'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Order #{selectedOrder?.id?.substring(0, 8)}</strong> for{' '}
                <strong>{selectedOrder?.retailer_name}</strong>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Total: ₦{parseFloat(selectedOrder?.total_amount || 0).toLocaleString()}
              </p>
            </div>

            {/* Bottle Exchange Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Did the customer bring empties?</h4>
              <BottleExchangeSection
                products={[]}
                emptyItems={emptyItems}
                value={bottleExchangeData}
                onChange={setBottleExchangeData}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={handleDeliver} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!viewingOrderDetails} onOpenChange={() => setViewingOrderDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Details - #{viewingOrderDetails?.id?.substring(0, 8)}
            </DialogTitle>
          </DialogHeader>
          
          {loadingOrderItems ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Order Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Retailer</p>
                    <p className="font-semibold">{viewingOrderDetails?.retailer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-lg">
                      ₦{parseFloat(viewingOrderDetails?.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <Badge variant="outline">{viewingOrderDetails?.payment_status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Status</p>
                    <Badge className={getStatusBadgeColor(viewingOrderDetails?.delivery_status)}>
                      {viewingOrderDetails?.delivery_status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {viewingOrderDetails?.driver_name && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-semibold">{viewingOrderDetails?.driver_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-semibold">{viewingOrderDetails?.vehicle_number}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h3 className="font-semibold">Items to Pack ({orderItems.length})</h3>
                </div>
                <div className="divide-y">
                  {orderItems.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No items found
                    </div>
                  ) : (
                    orderItems.map((item, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Unit Price: ₦{parseFloat(item.unit_price || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {item.quantity}
                            </p>
                            <p className="text-xs text-gray-500">units</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="font-semibold text-lg">
                            ₦{parseFloat(item.unit_price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Total */}
                {orderItems.length > 0 && (
                  <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Order Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₦{parseFloat(viewingOrderDetails?.total_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Warehouse Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Warehouse Instructions
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1 ml-6 list-disc">
                  <li>Verify all items and quantities match this list</li>
                  <li>Check product condition before packing</li>
                  <li>Ensure proper packaging for transport</li>
                  <li>Update status once packing is complete</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingOrderDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
