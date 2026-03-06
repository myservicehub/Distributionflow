'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Package, DollarSign, Check, ArrowRightLeft } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

export default function BottleExchangePage() {
  const { userProfile } = useAuth()
  const [retailers, setRetailers] = useState([])
  const [products, setProducts] = useState([])
  const [emptyItems, setEmptyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Form state
  const [selectedRetailer, setSelectedRetailer] = useState('')
  const [productsPurchased, setProductsPurchased] = useState([])
  const [emptiesBrought, setEmptiesBrought] = useState([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [retailersRes, productsRes, emptyRes] = await Promise.all([
        fetch('/api/retailers'),
        fetch('/api/products'),
        fetch('/api/empty-bottles?route=empty-items')
      ])

      if (retailersRes.ok) setRetailers(await retailersRes.json())
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        // Only show products with linked empties
        setProducts(productsData.filter(p => p.empty_item_id))
      }
      if (emptyRes.ok) setEmptyItems(await emptyRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const addProductRow = () => {
    setProductsPurchased([...productsPurchased, { product_id: '', quantity: '' }])
  }

  const removeProductRow = (index) => {
    setProductsPurchased(productsPurchased.filter((_, i) => i !== index))
  }

  const updateProductRow = (index, field, value) => {
    const updated = [...productsPurchased]
    updated[index][field] = value
    setProductsPurchased(updated)
  }

  const addEmptyRow = () => {
    setEmptiesBrought([...emptiesBrought, { empty_item_id: '', quantity: '' }])
  }

  const removeEmptyRow = (index) => {
    setEmptiesBrought(emptiesBrought.filter((_, i) => i !== index))
  }

  const updateEmptyRow = (index, field, value) => {
    const updated = [...emptiesBrought]
    updated[index][field] = value
    setEmptiesBrought(updated)
  }

  // Calculate totals and deposit
  const calculateTotals = () => {
    let totalProductsWithDeposit = 0
    let totalEmptiesBrought = 0
    let depositPerUnit = 0

    // Count products that need empties
    productsPurchased.forEach(row => {
      if (row.product_id && row.quantity) {
        const product = products.find(p => p.id === row.product_id)
        if (product && product.empty_item_id) {
          totalProductsWithDeposit += parseInt(row.quantity)
          // Get deposit value from linked empty
          const empty = emptyItems.find(e => e.id === product.empty_item_id)
          if (empty) depositPerUnit = parseFloat(empty.deposit_value || 0)
        }
      }
    })

    // Count empties brought
    emptiesBrought.forEach(row => {
      if (row.empty_item_id && row.quantity) {
        totalEmptiesBrought += parseInt(row.quantity)
      }
    })

    const shortfall = Math.max(0, totalProductsWithDeposit - totalEmptiesBrought)
    const depositAmount = shortfall * depositPerUnit

    return {
      totalProductsWithDeposit,
      totalEmptiesBrought,
      shortfall,
      depositPerUnit,
      depositAmount
    }
  }

  const handleSubmit = async () => {
    if (!selectedRetailer) {
      toast.error('Please select a retailer')
      return
    }

    if (productsPurchased.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    // Validate products
    for (const row of productsPurchased) {
      if (!row.product_id || !row.quantity || parseInt(row.quantity) <= 0) {
        toast.error('Please fill all product quantities')
        return
      }
    }

    // Validate empties
    for (const row of emptiesBrought) {
      if (row.empty_item_id && (!row.quantity || parseInt(row.quantity) <= 0)) {
        toast.error('Please fill all empty quantities')
        return
      }
    }

    const totals = calculateTotals()

    setProcessing(true)
    try {
      const response = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'process-bottle-exchange',
          retailer_id: selectedRetailer,
          products_purchased: productsPurchased.map(p => ({
            product_id: p.product_id,
            quantity: parseInt(p.quantity)
          })),
          empties_brought: emptiesBrought
            .filter(e => e.empty_item_id && e.quantity)
            .map(e => ({
              empty_item_id: e.empty_item_id,
              quantity: parseInt(e.quantity)
            })),
          deposit_amount: totals.depositAmount,
          notes: notes || 'Bottle exchange recorded'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process exchange')
      }

      const retailer = retailers.find(r => r.id === selectedRetailer)
      toast.success(`✅ Bottle exchange recorded for ${retailer?.shop_name}`)
      
      if (totals.depositAmount > 0) {
        toast.info(`Deposit collected: ₦${totals.depositAmount.toLocaleString()}`)
      }

      // Reset form
      setSelectedRetailer('')
      setProductsPurchased([])
      setEmptiesBrought([])
      setNotes('')
      loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const totals = calculateTotals()
  const formatCurrency = (amount) => `₦${parseFloat(amount).toLocaleString()}`

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!['admin', 'manager', 'sales_rep'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admin, managers, and sales reps can record bottle exchanges.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Bottle Exchange</h1>
        <p className="text-muted-foreground mt-2">
          Record when customers buy products and bring empty bottles
        </p>
      </div>

      {/* Retailer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Retailer</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose retailer..." />
            </SelectTrigger>
            <SelectContent>
              {retailers.map(retailer => (
                <SelectItem key={retailer.id} value={retailer.id}>
                  {retailer.shop_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Products Purchased */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products Purchased</CardTitle>
              <CardDescription>What is the customer buying?</CardDescription>
            </div>
            <Button onClick={addProductRow} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsPurchased.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products added yet. Click "Add Product" to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productsPurchased.map((row, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Product</Label>
                    <Select
                      value={row.product_id}
                      onValueChange={(value) => updateProductRow(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateProductRow(index, 'quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeProductRow(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empties Brought */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Empty Bottles Brought by Customer</CardTitle>
              <CardDescription>Did they bring any empties?</CardDescription>
            </div>
            <Button onClick={addEmptyRow} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Empty Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {emptiesBrought.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Customer brought no empties. Full deposit will be charged.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emptiesBrought.map((row, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Empty Type</Label>
                    <Select
                      value={row.empty_item_id}
                      onValueChange={(value) => updateEmptyRow(index, 'empty_item_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select empty type" />
                      </SelectTrigger>
                      <SelectContent>
                        {emptyItems.map(empty => (
                          <SelectItem key={empty.id} value={empty.id}>
                            {empty.name} - {formatCurrency(empty.deposit_value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateEmptyRow(index, 'quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeEmptyRow(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculation Summary */}
      {totals.totalProductsWithDeposit > 0 && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Exchange Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Products Requiring Empties</p>
                <p className="text-2xl font-bold">{totals.totalProductsWithDeposit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empties Brought</p>
                <p className="text-2xl font-bold text-green-600">{totals.totalEmptiesBrought}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Shortfall (Need to pay deposit for):</span>
                <span className="text-lg font-bold text-orange-600">{totals.shortfall} bottles</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Deposit per bottle:</span>
                <span className="text-lg font-medium">{formatCurrency(totals.depositPerUnit)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total Deposit to Collect:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(totals.depositAmount)}
                </span>
              </div>
            </div>

            {totals.depositAmount === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <strong>No deposit needed!</strong> Customer brought enough empties.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this exchange..."
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedRetailer('')
            setProductsPurchased([])
            setEmptiesBrought([])
            setNotes('')
          }}
        >
          Clear Form
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={processing || !selectedRetailer || productsPurchased.length === 0}
          size="lg"
        >
          {processing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Record Exchange
              {totals.depositAmount > 0 && ` & Collect ${formatCurrency(totals.depositAmount)}`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
