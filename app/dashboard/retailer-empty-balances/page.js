'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Package, Users, DollarSign, ArrowDownCircle, Search, AlertCircle, ChevronDown, ChevronUp, Store } from 'lucide-react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { toast } from 'sonner'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth-context'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'

// Mobile Card Component for Empty Balances
function EmptyBalanceMobileCard({ balance, onRecordReturn }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const totalValue = balance.quantity_outstanding * parseFloat(balance.empty_items?.deposit_value || 0)`
  }

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">
                  {balance.retailers?.shop_name || 'Unknown Retailer'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Package className="h-3 w-3" />
                {balance.empty_items?.name || 'Unknown Item'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={balance.quantity_outstanding > 50 ? 'destructive' : 'secondary'} className="text-base font-bold">
                {balance.quantity_outstanding}
              </Badge>
              <p className="text-xs text-neutral-500">units owed</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <span className="text-sm text-neutral-600">Total Value:</span>
            <span className="font-bold text-emerald-600">
              {formatCurrency(totalValue)}
            </span>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-600">Deposit/Unit:</span>
                <span className="font-medium text-neutral-900">
                  {formatCurrency(balance.empty_items?.deposit_value || 0)}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => onRecordReturn(balance)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Record Return
              </Button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" />View More Details</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RetailerEmptyBalancesPage() {
  const { userProfile } = useAuth()
  const [balances, setBalances] = useState([])
  const [filteredBalances, setFilteredBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState(null)
  const [returnQuantity, setReturnQuantity] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    
    loadBalances(controller.signal)
    
    return () => controller.abort()
  }, [])

  useEffect(() => {
    // Filter balances based on search term
    if (searchTerm) {
      const filtered = balances.filter(balance => 
        balance.retailers?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.empty_items?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredBalances(filtered)
    } else {
      setFilteredBalances(balances)
    }
  }, [searchTerm, balances])

  const loadBalances = async (signal) => {
    try {
      const response = await fetch('/api/empty-bottles?route=retailer-empty-balances', { signal })
      if (!response.ok) {
        const error = await response.json()
        if (error.code === 'FEATURE_NOT_AVAILABLE') {
          toast.error(error.message)
          return
        }
        throw new Error('Failed to load retailer balances')
      }
      const data = await response.json()
      // Only show balances with quantity > 0
      const activeBalances = data.filter(b => b.quantity_outstanding > 0)
      setBalances(activeBalances)
      setFilteredBalances(activeBalances)
    } catch (error) {
      toast.error('Failed to load retailer empty balances')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnClick = (balance) => {
    setSelectedBalance(balance)
    setReturnQuantity('')
    setReturnNotes('')
    setShowReturnDialog(true)
  }

  const handleProcessReturn = async () => {
    if (!returnQuantity || parseInt(returnQuantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (parseInt(returnQuantity) > selectedBalance.quantity_outstanding) {
      toast.error(`Cannot return more than ${selectedBalance.quantity_outstanding} units`)
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'process-empty-return',
          retailer_id: selectedBalance.retailer_id,
          empty_item_id: selectedBalance.empty_item_id,
          quantity_returned: parseInt(returnQuantity),
          notes: returnNotes || `Return from ${selectedBalance.retailers?.shop_name}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process return')
      }

      toast.success(`Successfully recorded return of ${returnQuantity} ${selectedBalance.empty_items?.name}`)
      setShowReturnDialog(false)
      setSelectedBalance(null)
      setReturnQuantity('')
      setReturnNotes('')
      loadBalances()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcessing(false)
    }
  }`
  }

  // Calculate summary metrics
  const totalRetailers = new Set(filteredBalances.map(b => b.retailer_id)).size
  const totalQuantity = filteredBalances.reduce((sum, b) => sum + b.quantity_outstanding, 0)
  const totalDepositValue = filteredBalances.reduce((sum, b) => 
    sum + (b.quantity_outstanding * parseFloat(b.empty_items?.deposit_value || 0)), 0
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading retailer balances...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!['admin', 'manager', 'warehouse'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admin, managers, and warehouse staff can view empty balances.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Retailer Empty Balances</h1>
        <p className="text-neutral-600 mt-2">
          Track which retailers have empty bottles and process returns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retailers with Empties</CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{totalRetailers}</div>
            <p className="text-xs text-neutral-500 mt-1">
              {totalRetailers === 1 ? 'retailer has' : 'retailers have'} outstanding empties
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity Owed</CardTitle>
            <Package className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-neutral-500 mt-1">
              Empty bottles to be returned
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all sm:col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposit Value</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalDepositValue)}</div>
            <p className="text-xs text-neutral-500 mt-1">
              Value tied up in empties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      {filteredBalances.length === 0 && !searchTerm && (
        <Alert className="border-2 border-emerald-200 bg-emerald-50">
          <AlertCircle className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-emerald-900">
            No retailers currently have outstanding empty bottles. When you issue empties to retailers,
            they will appear here until they return them.
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      {balances.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search by retailer or empty item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 focus:border-emerald-500"
            />
          </div>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')} className="border-2 w-full sm:w-auto">
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Balances - Mobile View */}
      {filteredBalances.length > 0 && (
        <div className="block md:hidden space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              Outstanding Balances ({filteredBalances.length})
            </h3>
          </div>
          {filteredBalances.map((balance) => (
            <EmptyBalanceMobileCard
              key={`${balance.retailer_id}-${balance.empty_item_id}`}
              balance={balance}
              onRecordReturn={handleReturnClick}
            />
          ))}
        </div>
      )}

      {/* Balances - Desktop Table */}
      {filteredBalances.length > 0 && (
        <Card className="hidden md:block border-2 border-neutral-200 shadow-lg">
          <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
            <CardTitle className="text-neutral-900">Outstanding Empty Balances</CardTitle>
            <CardDescription>
              Showing {filteredBalances.length} balance{filteredBalances.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="font-semibold">Retailer</TableHead>
                    <TableHead className="font-semibold">Empty Item</TableHead>
                    <TableHead className="text-right font-semibold">Quantity Owed</TableHead>
                    <TableHead className="text-right font-semibold">Deposit Value/Unit</TableHead>
                    <TableHead className="text-right font-semibold">Total Value</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((balance) => {
                    const totalValue = balance.quantity_outstanding * parseFloat(balance.empty_items?.deposit_value || 0)
                    return (
                      <TableRow key={`${balance.retailer_id}-${balance.empty_item_id}`} className="hover:bg-emerald-50 transition-colors duration-150">
                        <TableCell className="font-medium text-neutral-900">
                          {balance.retailers?.shop_name || 'Unknown Retailer'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-neutral-500" />
                            <span className="text-neutral-900">{balance.empty_items?.name || 'Unknown Item'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={balance.quantity_outstanding > 50 ? 'destructive' : 'secondary'}>
                            {balance.quantity_outstanding}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-neutral-900">
                          {formatCurrency(balance.empty_items?.deposit_value || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(totalValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnClick(balance)}
                            className="border-2 hover:border-emerald-500 hover:text-emerald-600"
                          >
                            <ArrowDownCircle className="h-4 w-4 mr-2" />
                            Record Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {filteredBalances.length === 0 && searchTerm && (
        <Card className="border-2 border-neutral-200">
          <CardContent className="py-10">
            <div className="text-center text-neutral-600">
              <Search className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
              <p className="font-medium">No balances found matching "{searchTerm}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Empty Return</DialogTitle>
            <DialogDescription>
              Process empty bottle return from {selectedBalance?.retailers?.shop_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBalance && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Empty Item:</span>
                  <span className="font-medium text-emerald-900">{selectedBalance.empty_items?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Currently Owed:</span>
                  <span className="font-medium text-emerald-900">{selectedBalance.quantity_outstanding} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Deposit Value:</span>
                  <span className="font-medium text-emerald-900">
                    {formatCurrency(selectedBalance.empty_items?.deposit_value || 0)}/unit
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return-quantity">Quantity Returned *</Label>
                <Input
                  id="return-quantity"
                  type="number"
                  min="1"
                  max={selectedBalance.quantity_owed}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="border-2 focus:border-emerald-500"
                />
                <p className="text-xs text-neutral-500">
                  Maximum: {selectedBalance.quantity_outstanding} units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return-notes">Notes (Optional)</Label>
                <Input
                  id="return-notes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Add any notes about this return"
                />
              </div>

              {returnQuantity && parseInt(returnQuantity) > 0 && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    Return Value: {formatCurrency(
                      parseInt(returnQuantity) * parseFloat(selectedBalance.empty_items?.deposit_value || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    New balance after return: {selectedBalance.quantity_outstanding - parseInt(returnQuantity)} units
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)} disabled={processing} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleProcessReturn} disabled={processing || !returnQuantity} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {processing ? 'Processing...' : 'Record Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
