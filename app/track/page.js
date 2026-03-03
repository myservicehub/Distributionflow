'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Package, CheckCircle, XCircle, Truck, Clock, MapPin } from 'lucide-react'

export default function TrackOrderPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const trackOrder = async () => {
    if (!searchTerm) return
    
    try {
      setLoading(true)
      setError(null)
      setOrder(null)
      
      const response = await fetch(`/api/track/${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Order not found')
      }
      
      setOrder(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'preparing':
        return 'bg-blue-100 text-blue-700'
      case 'packed':
        return 'bg-purple-100 text-purple-700'
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700'
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-orange-600" />
      case 'preparing':
      case 'packed':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const Timeline = ({ order }) => {
    const events = []
    
    if (order.created_at) {
      events.push({
        title: 'Order Created',
        date: order.created_at,
        completed: true
      })
    }
    
    if (order.confirmed_at) {
      events.push({
        title: 'Order Confirmed',
        date: order.confirmed_at,
        completed: true
      })
    }
    
    if (order.packed_at) {
      events.push({
        title: 'Order Packed',
        date: order.packed_at,
        completed: true
      })
    }
    
    if (order.dispatched_at) {
      events.push({
        title: 'Out for Delivery',
        date: order.dispatched_at,
        completed: true,
        driver: order.driver_name,
        vehicle: order.vehicle_number
      })
    }
    
    if (order.delivered_at) {
      events.push({
        title: 'Delivered',
        date: order.delivered_at,
        completed: true
      })
    }
    
    return (
      <div className="relative space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                event.completed ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {event.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 absolute top-10" />
              )}
            </div>
            <div className="flex-1 pb-8">
              <p className="font-semibold text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-500">
                {new Date(event.date).toLocaleString()}
              </p>
              {event.driver && (
                <p className="text-sm text-gray-600 mt-1">
                  Driver: {event.driver} {event.vehicle && `• ${event.vehicle}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order ID or delivery reference to track your delivery
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter Order ID or Delivery Reference"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                  className="pl-10"
                />
              </div>
              <Button onClick={trackOrder} disabled={loading}>
                {loading ? 'Tracking...' : 'Track Order'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardContent className="p-6 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
                  <Badge className={getStatusColor(order.delivery_status)}>
                    {order.delivery_status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  {getStatusIcon(order.delivery_status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.delivery_status === 'delivered' && 'Your order has been delivered!'}
                      {order.delivery_status === 'out_for_delivery' && 'Your order is on the way'}
                      {order.delivery_status === 'packed' && 'Your order is packed and ready'}
                      {order.delivery_status === 'preparing' && 'Your order is being prepared'}
                      {order.delivery_status === 'failed' && 'Delivery attempt failed'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Order placed {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {order.delivery_reference && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Delivery Reference</p>
                    <p className="font-mono font-semibold">{order.delivery_reference}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline order={order} />
              </CardContent>
            </Card>

            {/* Delivery Info */}
            {(order.driver_name || order.vehicle_number) && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.driver_name && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Truck className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-medium">{order.driver_name}</p>
                      </div>
                    </div>
                  )}
                  {order.vehicle_number && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium">{order.vehicle_number}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Help Text */}
        {!order && !error && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <p className="text-sm text-blue-900 text-center">
                💡 <strong>Tip:</strong> You can find your order ID in your order confirmation SMS or email
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
