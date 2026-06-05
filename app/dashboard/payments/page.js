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
import { Plus, DollarSign } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [retailers, setRetailers] = useState([])
  const [selectedRetailer, setSelectedRetailer] = useState(null)
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
      setRetailers(data)
    } catch (error) {
      console.error('Error loading retailers:', error)
      toast.error('Failed to load retailers')
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
      loadRetailers()
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
    setSelectedRetailer(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-slide-down">
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Payments</h2>
          <p className="text-neutral-600 mt-2">Record and track customer payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group h-12">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
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
                  onValueChange={(value) => {
                    setFormData({ ...formData, retailer_id: value })
                    const retailer = retailers.find(r => r.id === value)
                    setSelectedRetailer(retailer)
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retailer" />
                  </SelectTrigger>
                  <SelectContent>
                    {retailers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No retailers found
                      </div>
                    ) : (
                      retailers.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.shop_name} - Balance: ₦{parseFloat(r.current_balance || 0).toLocaleString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedRetailer && (
                  <p className="text-sm text-neutral-600 mt-2">
                    Current Balance: <span className="font-semibold">₦{parseFloat(selectedRetailer.current_balance || 0).toLocaleString()}</span>
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

      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-success-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Payment History ({payments.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Retailer</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Payment Method</TableHead>
                  <TableHead className="font-semibold">Recorded By</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-neutral-50 transition-colors duration-150">
                    <TableCell className="text-neutral-700">{new Date(payment.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{payment.retailers?.shop_name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-success-600">₦{parseFloat(payment.amount_paid).toLocaleString()}</TableCell>
                    <TableCell className="capitalize text-neutral-700">{payment.payment_method?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-neutral-700">{payment.users?.name || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-neutral-600">{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {payments.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">No payments recorded yet</p>
                <p className="text-neutral-500 text-sm mt-1">Start recording customer payments</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
