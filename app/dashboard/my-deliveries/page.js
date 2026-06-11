'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  PackageCheck, 
  MapPin, 
  Phone, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Package,
  User,
  TruckIcon,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function MyDeliveriesPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef(null)

  // State management
  const [activeTab, setActiveTab] = useState('active')
  const [deliveries, setDeliveries] = useState([])
  const [driverInfo, setDriverInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // Action states
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [proofPhoto, setProofPhoto] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [failReason, setFailReason] = useState('')
  const [failNote, setFailNote] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  
  // Dialog states
  const [showDeliverDialog, setShowDeliverDialog] = useState(false)
  const [showFailDialog, setShowFailDialog] = useState(false)

  // Failure reasons
  const FAIL_REASONS = [
    'Customer not available',
    'Wrong address',
    'Refused to accept',
    'Payment issue',
    'Access denied to location',
    'Other'
  ]

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchDeliveries()
    }
  }, [activeTab, user])

  async function checkUser() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/login')
        return
      }

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', currentUser.id)
        .single()

      if (userData?.role !== 'driver') {
        toast.error('Access denied: This page is for drivers only')
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  async function fetchDeliveries() {
    try {
      setLoading(true)
      const response = await fetch(`/api/my-deliveries?status=${activeTab}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries')
      }

      const result = await response.json()
      
      if (result.success) {
        setDeliveries(result.data.orders || [])
        setDriverInfo(result.data.driver)
      } else {
        throw new Error(result.error || 'Failed to load deliveries')
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      toast.error('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoCapture(event, order) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setProofPhoto(file)
    setProofPreview(URL.createObjectURL(file))
    setSelectedOrder(order)
    setShowDeliverDialog(true)
  }

  function openCamera(order) {
    setSelectedOrder(order)
    fileInputRef.current?.click()
  }

  async function uploadProof() {
    if (!proofPhoto || !selectedOrder) return null

    try {
      const formData = new FormData()
      formData.append('photo', proofPhoto)
      formData.append('orderId', selectedOrder.id)

      const response = await fetch('/api/my-deliveries/upload-proof', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.data.url
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
      return null
    }
  }

  async function handleMarkDelivered() {
    if (!selectedOrder || !proofPhoto) {
      toast.error('Please capture a proof of delivery photo')
      return
    }

    try {
      setProcessingAction(true)

      // Upload photo first
      const proofUrl = await uploadProof()
      if (!proofUrl) return

      // Get location if available
      let latitude = null
      let longitude = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch (geoError) {
          console.log('Location not available:', geoError)
        }
      }

      // Mark as delivered
      const response = await fetch(`/api/my-deliveries/${selectedOrder.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_url: proofUrl,
          note: deliveryNote || null,
          latitude,
          longitude
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as delivered')
      }

      toast.success('Delivery marked as completed! ✅')
      
      // Reset states
      setShowDeliverDialog(false)
      setProofPhoto(null)
      setProofPreview(null)
      setDeliveryNote('')
      setSelectedOrder(null)
      
      // Refresh list
      await fetchDeliveries()

    } catch (error) {
      console.error('Error marking delivered:', error)
      toast.error(error.message || 'Failed to mark as delivered')
    } finally {
      setProcessingAction(false)
    }
  }

  async function handleMarkFailed() {
    if (!selectedOrder || !failReason) {
      toast.error('Please select a failure reason')
      return
    }

    try {
      setProcessingAction(true)

      // Upload proof photo if available
      let proofUrl = null
      if (proofPhoto) {
        proofUrl = await uploadProof()
      }

      // Get location if available
      let latitude = null
      let longitude = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch (geoError) {
          console.log('Location not available:', geoError)
        }
      }

      // Mark as failed
      const response = await fetch(`/api/my-deliveries/${selectedOrder.id}/fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: failReason,
          note: failNote || null,
          proof_url: proofUrl,
          latitude,
          longitude
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as failed')
      }

      toast.error('Delivery marked as failed', {
        description: 'Admins have been notified'
      })
      
      // Reset states
      setShowFailDialog(false)
      setFailReason('')
      setFailNote('')
      setProofPhoto(null)
      setProofPreview(null)
      setSelectedOrder(null)
      
      // Refresh list
      await fetchDeliveries()

    } catch (error) {
      console.error('Error marking failed:', error)
      toast.error(error.message || 'Failed to mark as failed')
    } finally {
      setProcessingAction(false)
    }
  }

  function openFailDialog(order) {
    setSelectedOrder(order)
    setShowFailDialog(true)
  }

  function formatCurrency(amount) {
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handlePhotoCapture(e, selectedOrder)}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Deliveries</h1>
        {driverInfo && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TruckIcon className="h-4 w-4" />
              <span>{driverInfo.vehicle_number || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✓ {driverInfo.successful_deliveries || 0} Success
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                ✗ {driverInfo.failed_deliveries || 0} Failed
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active {deliveries.length > 0 && `(${deliveries.length})`}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <Alert>
              <PackageCheck className="h-4 w-4" />
              <AlertDescription>
                No active deliveries. Check back later!
              </AlertDescription>
            </Alert>
          ) : (
            deliveries.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onCapture={openCamera}
                onFail={openFailDialog}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <Alert>
              <PackageCheck className="h-4 w-4" />
              <AlertDescription>
                No completed deliveries yet.
              </AlertDescription>
            </Alert>
          ) : (
            deliveries.map((order) => (
              <CompletedDeliveryCard
                key={order.id}
                order={order}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Mark as Delivered Dialog */}
      <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
            <DialogDescription>
              Confirm delivery with proof of delivery photo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {proofPreview && (
              <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                <img
                  src={proofPreview}
                  alt="Proof of delivery"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <Label htmlFor="delivery-note">Delivery Note (Optional)</Label>
              <Textarea
                id="delivery-note"
                placeholder="e.g., Delivered to receptionist, Left at gate..."
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeliverDialog(false)
                setProofPhoto(null)
                setProofPreview(null)
                setDeliveryNote('')
              }}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkDelivered}
              disabled={processingAction || !proofPhoto}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Delivery
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Failed Dialog */}
      <Dialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Failed</DialogTitle>
            <DialogDescription>
              Select a reason for delivery failure
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fail-reason">Failure Reason *</Label>
              <select
                id="fail-reason"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select a reason...</option>
                {FAIL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="fail-note">Additional Notes (Optional)</Label>
              <Textarea
                id="fail-note"
                placeholder="Provide more details..."
                value={failNote}
                onChange={(e) => setFailNote(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Admins will be notified of this failure
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFailDialog(false)
                setFailReason('')
                setFailNote('')
              }}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkFailed}
              disabled={processingAction || !failReason}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as Failed
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Active Delivery Card Component
function DeliveryCard({ order, onCapture, onFail, formatCurrency, formatDate }) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
            <CardDescription className="text-sm mt-1">
              Dispatched: {formatDate(order.dispatched_at)}
            </CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {order.delivery_status === 'out_for_delivery' ? 'Out for Delivery' : 'Packed'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Retailer Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-medium">{order.retailers?.shop_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{order.retailers?.owner_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm">{order.retailers?.address || 'No address'}</p>
          </div>

          {order.retailers?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${order.retailers.phone}`} className="text-sm text-blue-600 hover:underline">
                {order.retailers.phone}
              </a>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Items ({order.order_items?.length || 0})</span>
          </div>
          <div className="space-y-1 ml-6">
            {order.order_items?.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-sm flex justify-between">
                <span className="text-muted-foreground">
                  {item.products?.name} x {item.quantity}
                </span>
                <span>{formatCurrency(item.total_price)}</span>
              </div>
            ))}
            {order.order_items?.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{order.order_items.length - 3} more items
              </p>
            )}
          </div>
          <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCapture(order)}
            className="w-full"
          >
            <Camera className="mr-2 h-4 w-4" />
            Capture & Deliver
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onFail(order)}
            className="w-full"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark Failed
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Completed Delivery Card Component
function CompletedDeliveryCard({ order, formatCurrency, formatDate }) {
  const isDelivered = order.delivery_status === 'delivered'

  return (
    <Card className={`border-l-4 ${isDelivered ? 'border-l-green-500' : 'border-l-red-500'} opacity-75`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {isDelivered ? 'Delivered' : 'Failed'}: {formatDate(order.delivered_at || order.updated_at)}
            </CardDescription>
          </div>
          <Badge className={isDelivered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isDelivered ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Delivered
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Failed
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium">{order.retailers?.shop_name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{order.retailers?.owner_name}</p>
          </div>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
        </div>

        {order.proof_of_delivery_note && (
          <div className="text-sm bg-muted p-2 rounded">
            <p className="text-muted-foreground">Note:</p>
            <p>{order.proof_of_delivery_note}</p>
          </div>
        )}

        {order.delivery_notes && !isDelivered && (
          <div className="text-sm bg-red-50 p-2 rounded border border-red-200">
            <p className="text-red-800 font-medium">Failure Reason:</p>
            <p className="text-red-700">{order.delivery_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
