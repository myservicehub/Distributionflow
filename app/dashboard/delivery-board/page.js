'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Package, Truck, CheckCircle, XCircle, Search, Calendar, User, CreditCard, Eye, FileText } from 'lucide-react'
import BottleExchangeSection from '@/components/BottleExchangeSection'
import { Pagination } from '@/components/ui/pagination'

export default function DeliveryBoardPage() {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('preparing')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 9  // 3x3 grid on desktop
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
      const responseData = await response.json()
      // Handle both old format (array) and new format (object with data property)
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
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
      const responseData = await response.json()
      
      if (!response.ok) throw new Error(responseData.error || 'Failed to load orders')

      // Handle both old format (array) and new format (object with data property)
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])

      // Filter for orders in the delivery workflow (confirmed or completed)
      const workflowOrders = (data || []).filter(o => {
        return (o.order_status === 'confirmed' || o.order_status === 'completed') && !o.is_legacy_order
      })

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

  // Filter orders by tab and search using useMemo
  const filteredOrders = useMemo(() => {
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
  }, [orders, selectedTab, searchTerm])

  // Pagination with useMemo
  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredOrders.slice(startIndex, startIndex + pageSize)
  }, [filteredOrders, currentPage, pageSize])

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTab, searchTerm])

  const getTabOrders = () => {
    return paginatedOrders
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
    <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base text-neutral-900">
              Order #{order.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              {order.retailer_name || 'Unknown Retailer'}
            </p>
          </div>
          <Badge className={`${getStatusBadgeColor(order.delivery_status)} border font-medium`}>
            {order.delivery_status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-neutral-700">
            <User className="h-4 w-4 text-neutral-500" />
            <span>{order.sales_rep_name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <CreditCard className="h-4 w-4 text-neutral-500" />
            <span className="font-semibold text-neutral-900">₦{parseFloat(order.total_amount).toLocaleString()}</span>
            <Badge variant="outline" className="text-xs border-neutral-300">
              {order.payment_status}
            </Badge>
          </div>
          {order.confirmed_at && (
            <div className="flex items-center gap-2 text-neutral-600">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <span className="text-xs">{new Date(order.confirmed_at).toLocaleString()}</span>
            </div>
          )}
          {order.driver_name && (
            <div className="flex items-center gap-2 text-neutral-700">
              <Truck className="h-4 w-4 text-neutral-500" />
              <span className="text-xs">{order.driver_name} • {order.vehicle_number}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {/* View Details Button - Always visible */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => loadOrderItems(order.id)}
            className="w-full hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700"
          >
            <FileText className="h-4 w-4 mr-1" />
            View Order Details
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {order.delivery_status === 'preparing' && (
              <Button size="sm" onClick={() => handleAction(order, 'pack')} className="flex-1 bg-primary-500 hover:bg-primary-600">
                <Package className="h-4 w-4 mr-1" />
                Mark as Packed
              </Button>
            )}
            {order.delivery_status === 'packed' && (
              <Button size="sm" onClick={() => handleAction(order, 'dispatch')} className="flex-1 bg-primary-500 hover:bg-primary-600">
                <Truck className="h-4 w-4 mr-1" />
                Dispatch
              </Button>
            )}
            {order.delivery_status === 'out_for_delivery' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleAction(order, 'deliver')} 
                  className="flex-1 bg-success-500 hover:bg-success-600 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Delivered
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleAction(order, 'fail_delivery')} 
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
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
    <div className="space-y-8">
      <div className="animate-slide-down">
        <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Delivery Board</h2>
        <p className="text-neutral-600 mt-2">Track and manage order deliveries</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by order ID, retailer, or sales rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Tabs - Mobile Optimized */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-300 ${
              selectedTab === tab.id
                ? 'bg-gradient-primary text-white shadow-glow-primary'
                : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-200 hover:border-primary-300'
            }`}
          >
            <span className="block sm:inline">{tab.label}</span>
            <span className={`ml-2 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold ${
              selectedTab === tab.id ? 'bg-white/20' : 'bg-neutral-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : getTabOrders().length === 0 ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
              <Package className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-neutral-600 text-lg font-medium">No orders in this status</p>
            <p className="text-neutral-500 text-sm mt-1">Orders will appear here when they match this delivery status</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getTabOrders().map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 animate-fade-in">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Dispatch Dialog */}
      <Dialog open={actionDialog === 'dispatch'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch Order</DialogTitle>
            <DialogDescription>
              Enter driver and vehicle details to dispatch this order for delivery.
            </DialogDescription>
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
            <DialogDescription>
              Confirm delivery completion and record any empty bottles returned by the customer.
            </DialogDescription>
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
            <DialogDescription>
              View complete order information including items, pricing, and delivery status.
            </DialogDescription>
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
