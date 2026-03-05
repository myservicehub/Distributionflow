'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

export default function ManufacturerSupplyPage() {
  const { userProfile } = useAuth()
  const [emptyItems, setEmptyItems] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({ empty_item_id: '', quantity: '', notes: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEmptyItems()
  }, [])

  const loadEmptyItems = async () => {
    try {
      const response = await fetch('/api/empty-bottles?route=empty-items', {
        cache: 'no-store' // Ensure fresh data on each load
      })
      if (!response.ok) throw new Error('Failed to load empty items')
      const data = await response.json()
      setEmptyItems(data.filter(item => item.is_active))
    } catch (error) {
      toast.error('Failed to load empty items')
      console.error(error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.empty_item_id || !formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error('Please fill all fields correctly')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'manufacturer-supply',
          empty_item_id: formData.empty_item_id,
          quantity: parseInt(formData.quantity),
          notes: formData.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record supply')
      }

      toast.success('Manufacturer supply recorded successfully')
      setShowDialog(false)
      setFormData({ empty_item_id: '', quantity: '', notes: '' })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!['admin', 'manager', 'warehouse'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only authorized roles can record manufacturer supplies.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manufacturer Supply</h1>
          <p className="text-muted-foreground">Record empty items received from manufacturer</p>
        </div>
        <Button onClick={() => {
          loadEmptyItems() // Refresh empty items list when opening dialog
          setShowDialog(true)
        }}>
          <Truck className="h-4 w-4 mr-2" />
          Record Supply
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Manufacturer supply workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-medium">Receive Empties</p>
                <p className="text-sm text-muted-foreground">Record quantity of empties received from manufacturer</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-medium">Warehouse Stock Updated</p>
                <p className="text-sm text-muted-foreground">Empties are added to your warehouse inventory</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-medium">Movement Logged</p>
                <p className="text-sm text-muted-foreground">Transaction is recorded for audit and reconciliation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guidelines</CardTitle>
            <CardDescription>Best practices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ Count empties carefully before recording</p>
            <p>✓ Verify quality and condition</p>
            <p>✓ Add notes about supplier, delivery date, or condition</p>
            <p>✓ Damaged empties should be recorded separately</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manufacturer Supply</DialogTitle>
            <DialogDescription>
              Record empties received from manufacturer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="empty_item">Empty Item</Label>
              <Select
                value={formData.empty_item_id}
                onValueChange={(value) => setFormData({ ...formData, empty_item_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select empty item" />
                </SelectTrigger>
                <SelectContent>
                  {emptyItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (₦{item.deposit_value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Received</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="E.g., Supplier name, delivery date, condition..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Recording...' : 'Record Supply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
