'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { Plus, DollarSign, ChevronDown, ChevronUp, Calendar, User, CreditCard, FileText, Store, Search } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

// Mobile Card Component for Payments
function PaymentMobileCard({ payment }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">
                  {payment.retailers?.shop_name || 'Unknown Retailer'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(payment.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xl font-bold text-emerald-600">
                ₦{parseFloat(payment.amount_paid).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Method - Always Visible */}
          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-neutral-600">Method:</span>
            </div>
            <span className="font-medium text-neutral-900 capitalize text-sm">
              {payment.payment_method?.replace('_', ' ')}
            </span>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">Recorded by:</span>
                </div>
                <span className="font-medium text-neutral-900 text-sm">{payment.users?.name || 'N/A'}</span>
              </div>
              
              {payment.notes && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1 font-medium">
                    <FileText className="h-3 w-3" />
                    Notes:
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{payment.notes}</p>
                </div>
              )}
              
              <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                Recorded on {new Date(payment.created_at).toLocaleString()}
              </div>
            </div>
          )}

          {/* View More/Less Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View More Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [retailers, setRetailers] = useState([])
  const [selectedRetailer, setSelectedRetailer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [formData, setFormData] = useState({
    retailer_id: '',
    amount_paid: '0',
    payment_method: 'cash',
    notes: ''
  })
  const supabase = createClient()

  useEffect(() => {
    const controller = new AbortController()
    
    loadPayments(controller.signal)
    loadRetailers(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadPayments = async (signal) => {
    try {
      const response = await fetch('/api/payments', { signal })
      if (!response.ok) throw new Error('Failed to load payments')
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const loadRetailers = async (signal) => {
    try {
      const response = await fetch('/api/retailers', { signal })
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

  // Filter payments based on search term
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments

    const lowerSearch = searchTerm.toLowerCase()
    return payments.filter(payment =>
      payment.retailers?.shop_name?.toLowerCase().includes(lowerSearch) ||
      payment.payment_method?.toLowerCase().includes(lowerSearch) ||
      payment.reference_number?.toLowerCase().includes(lowerSearch)
    )
  }, [payments, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / pageSize)
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredPayments.slice(startIndex, startIndex + pageSize)
  }, [filteredPayments, currentPage, pageSize])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" role="status" aria-label="Loading"><span className="sr-only">Loading...</span></div>
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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg group h-12">
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

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Record Payment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by retailer name, payment method, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-2"
          />
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4 animate-fade-in">
        {filteredPayments.length === 0 ? (
          <Card className="border-2 border-neutral-200">
            <CardContent className="p-0">
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <DollarSign className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching payments' : 'No payments recorded yet'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start recording customer payments'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Payment History ({filteredPayments.length})</h3>
            </div>
            {paginatedPayments.map((payment) => (
              <PaymentMobileCard key={payment.id} payment={payment} />
            ))}
            {totalPages > 1 && (
              <div className="pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredPayments.length}
                  pageSize={pageSize}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop View - Table Layout */}
      <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Payment History ({filteredPayments.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table aria-label="Data table">
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
                {paginatedPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-emerald-50 transition-colors duration-150">
                    <TableCell className="text-neutral-700">{new Date(payment.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{payment.retailers?.shop_name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">₦{parseFloat(payment.amount_paid).toLocaleString()}</TableCell>
                    <TableCell className="capitalize text-neutral-700">{payment.payment_method?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-neutral-700">{payment.users?.name || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-neutral-600">{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredPayments.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <DollarSign className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching payments' : 'No payments recorded yet'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start recording customer payments'}
                </p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="p-4 border-t border-neutral-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredPayments.length}
                  pageSize={pageSize}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
