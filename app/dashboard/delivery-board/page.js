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
import { Package, Truck, CheckCircle, XCircle, Search, Calendar, User, CreditCard } from 'lucide-react'

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
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      loadOrders()
      
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

        <div className="mt-4 flex gap-2">
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
    </div>
  )
}
