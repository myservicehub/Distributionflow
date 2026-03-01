'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [retailers, setRetailers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    retailer_id: '',
    amount_paid: '0',
    payment_method: 'cash',
    notes: ''
  })
  const supabase = createClient()

  useEffect(() => {
    loadPayments()
    loadRetailers()
  }, [])

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (!response.ok) throw new Error('Failed to load payments')
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const loadRetailers = async () => {
    try {
      const response = await fetch('/api/retailers')
      if (!response.ok) throw new Error('Failed to load retailers')
      const data = await response.json()
      setRetailers(data.filter(r => parseFloat(r.current_balance) > 0))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (parseFloat(formData.amount_paid) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to record payment')

      toast.success('Payment recorded successfully!')
      setDialogOpen(false)
      resetForm()
      loadPayments()
      loadRetailers() // Reload to update balances
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      retailer_id: '',
      amount_paid: '0',
      payment_method: 'cash',
      notes: ''
    })
  }

  const selectedRetailer = retailers.find(r => r.id === formData.retailer_id)

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
          <h2 className="text-3xl font-bold text-gray-900">Payments</h2>
          <p className="text-gray-600 mt-2">Record and track customer payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment from a retailer
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
                      <SelectItem key={r.id} value={r.id}>
                        {r.shop_name} (Balance: ₦{parseFloat(r.current_balance).toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRetailer && (
                  <p className="text-sm text-gray-600 mt-2">
                    Current Balance: <span className="font-semibold">₦{parseFloat(selectedRetailer.current_balance).toLocaleString()}</span>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="amount_paid">Amount Paid (₦) *</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>

              <Button type="submit" className="w-full">Record Payment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{payment.retailers?.shop_name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-green-600">₦{parseFloat(payment.amount_paid).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ')}</TableCell>
                    <TableCell>{payment.users?.name || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No payments recorded yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
