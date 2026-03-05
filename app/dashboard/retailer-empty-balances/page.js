'use client'

import { useState, useEffect } from 'react'
import { Package, Users, DollarSign, ArrowDownCircle, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

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
    loadBalances()
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

  const loadBalances = async () => {
    try {
      const response = await fetch('/api/empty-bottles?route=retailer-empty-balances')
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
      const activeBalances = data.filter(b => b.quantity_owed > 0)
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

    if (parseInt(returnQuantity) > selectedBalance.quantity_owed) {
      toast.error(`Cannot return more than ${selectedBalance.quantity_owed} units`)
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
  }

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  // Calculate summary metrics
  const totalRetailers = new Set(filteredBalances.map(b => b.retailer_id)).size
  const totalQuantity = filteredBalances.reduce((sum, b) => sum + b.quantity_owed, 0)
  const totalDepositValue = filteredBalances.reduce((sum, b) => 
    sum + (b.quantity_owed * parseFloat(b.empty_items?.deposit_value || 0)), 0
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading retailer balances...</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retailer Empty Balances</h1>
          <p className="text-muted-foreground mt-2">
            Track which retailers have empty bottles and process returns
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retailers with Empties</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRetailers}</div>
            <p className="text-xs text-muted-foreground">
              {totalRetailers === 1 ? 'retailer has' : 'retailers have'} outstanding empties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity Owed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Empty bottles to be returned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposit Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDepositValue)}</div>
            <p className="text-xs text-muted-foreground">
              Value tied up in empties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      {filteredBalances.length === 0 && !searchTerm && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No retailers currently have outstanding empty bottles. When you issue empties to retailers,
            they will appear here until they return them.
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      {balances.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by retailer or empty item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Balances Table */}
      {filteredBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Empty Balances</CardTitle>
            <CardDescription>
              Showing {filteredBalances.length} balance{filteredBalances.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Empty Item</TableHead>
                  <TableHead className="text-right">Quantity Owed</TableHead>
                  <TableHead className="text-right">Deposit Value/Unit</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance) => {
                  const totalValue = balance.quantity_owed * parseFloat(balance.empty_items?.deposit_value || 0)
                  return (
                    <TableRow key={`${balance.retailer_id}-${balance.empty_item_id}`}>
                      <TableCell className="font-medium">
                        {balance.retailers?.shop_name || 'Unknown Retailer'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {balance.empty_items?.name || 'Unknown Item'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={balance.quantity_owed > 50 ? 'destructive' : 'secondary'}>
                          {balance.quantity_owed}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(balance.empty_items?.deposit_value || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(totalValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnClick(balance)}
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
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {filteredBalances.length === 0 && searchTerm && (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No balances found matching "{searchTerm}"</p>
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
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Empty Item:</span>
                  <span className="font-medium">{selectedBalance.empty_items?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Currently Owed:</span>
                  <span className="font-medium">{selectedBalance.quantity_owed} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit Value:</span>
                  <span className="font-medium">
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
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {selectedBalance.quantity_owed} units
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
                    New balance after return: {selectedBalance.quantity_owed - parseInt(returnQuantity)} units
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleProcessReturn} disabled={processing || !returnQuantity}>
              {processing ? 'Processing...' : 'Record Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
