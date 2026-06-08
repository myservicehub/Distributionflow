'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Package, Link2, AlertCircle, CheckCircle, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// Mobile Card Component for Product-Empty Links
function ProductEmptyLinkMobileCard({ product, emptyItems, linkedEmpty, onLinkProduct, onCreateEmpty, updating, formatCurrency }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{product.name}</h3>
              </div>
              {product.sku && (
                <p className="text-xs text-neutral-500">SKU: {product.sku}</p>
              )}
            </div>
            {product.empty_item_id ? (
              <Badge variant="default" className="bg-success-600 font-medium flex-shrink-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-medium flex-shrink-0">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Linked
              </Badge>
            )}
          </div>

          {/* Link Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-600">Link to Empty Item:</Label>
            <Select
              value={product.empty_item_id || 'none'}
              onValueChange={(value) => onLinkProduct(product.id, value === 'none' ? null : value)}
              disabled={updating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select empty item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No empty linked</span>
                </SelectItem>
                {emptyItems.map((empty) => (
                  <SelectItem key={empty.id} value={empty.id}>
                    {empty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expandable Details */}
          {isExpanded && linkedEmpty && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Deposit Value:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(linkedEmpty.deposit_value)}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Link2 className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-700">Linked to: {linkedEmpty.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!product.empty_item_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateEmpty(product)}
                className="flex-1 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Empty
              </Button>
            )}
            {linkedEmpty && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`${product.empty_item_id ? 'flex-1' : 'w-auto'} hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all`}
              >
                {isExpanded ? (
                  <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
                ) : (
                  <><ChevronDown className="h-4 w-4 mr-1" />View Details</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProductEmptyLinksPage() {
  const { userProfile } = useAuth()
  const [products, setProducts] = useState([])
  const [emptyItems, setEmptyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [newEmptyName, setNewEmptyName] = useState('')
  const [newEmptyDeposit, setNewEmptyDeposit] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load products with empty item details
      const productsRes = await fetch('/api/products')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      // Load empty items
      const emptyRes = await fetch('/api/empty-bottles?route=empty-items')
      if (emptyRes.ok) {
        const emptyData = await emptyRes.json()
        setEmptyItems(emptyData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkProduct = async (productId, emptyItemId) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empty_item_id: emptyItemId || null })
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      const product = products.find(p => p.id === productId)
      const emptyItem = emptyItems.find(e => e.id === emptyItemId)
      
      if (emptyItemId) {
        toast.success(`✅ Linked "${product.name}" to "${emptyItem?.name}"`)
      } else {
        toast.success(`Unlinked empty from "${product.name}"`)
      }
      
      loadData() // Reload to show updated links
    } catch (error) {
      toast.error('Failed to link product')
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateEmptyForProduct = async () => {
    if (!newEmptyName || !newEmptyDeposit) {
      toast.error('Please fill all fields')
      return
    }

    setUpdating(true)
    try {
      // Create new empty item
      const createRes = await fetch('/api/empty-bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'create-empty-item',
          name: newEmptyName,
          deposit_value: parseFloat(newEmptyDeposit)
        })
      })

      if (!createRes.ok) {
        throw new Error('Failed to create empty item')
      }

      const newEmpty = await createRes.json()

      // Link the product to the new empty
      await handleLinkProduct(selectedProduct.id, newEmpty.id)

      toast.success(`✅ Created "${newEmptyName}" and linked to "${selectedProduct.name}"`)
      setShowCreateDialog(false)
      setNewEmptyName('')
      setNewEmptyDeposit('')
      setSelectedProduct(null)
      loadData()
    } catch (error) {
      toast.error('Failed to create empty item')
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const openCreateDialog = (product) => {
    setSelectedProduct(product)
    setNewEmptyName(`${product.name} Empty Bottle`)
    setNewEmptyDeposit('50')
    setShowCreateDialog(true)
  }`
  }

  // Calculate stats
  const linkedCount = products.filter(p => p.empty_item_id).length
  const unlinkedCount = products.length - linkedCount
  const totalProducts = products.length

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products and empties...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!['admin', 'manager'].includes(userProfile?.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admin and managers can manage product-empty links.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-3xl font-bold tracking-tight">Product-Empty Links</h1>
        <p className="text-muted-foreground mt-2">
          Connect products to their corresponding empty bottles
        </p>
        <Button 
          onClick={() => loadData()} 
          variant="outline" 
          className="mt-4 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 border-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Why link products to empties?</strong> When you link a product to an empty bottle, 
          the system can automatically track empties when orders are fulfilled, reducing manual work.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{linkedCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalProducts > 0 ? Math.round((linkedCount / totalProducts) * 100) : 0}% linked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unlinked Products</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unlinkedCount}</div>
            <p className="text-xs text-muted-foreground">Need empty assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Products - Mobile & Desktop Views */}
      {products.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Link2 className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Product Mapping ({products.length})</h3>
            </div>
            {products.map((product) => {
              const linkedEmpty = emptyItems.find(e => e.id === product.empty_item_id)
              return (
                <ProductEmptyLinkMobileCard
                  key={product.id}
                  product={product}
                  emptyItems={emptyItems}
                  linkedEmpty={linkedEmpty}
                  onLinkProduct={handleLinkProduct}
                  onCreateEmpty={openCreateDialog}
                  updating={updating}
                  formatCurrency={formatCurrency}
                />
              )
            })}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
              <CardTitle>Product-Empty Mapping</CardTitle>
              <CardDescription>
                Link each product to its corresponding empty bottle
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">SKU</TableHead>
                      <TableHead className="font-semibold">Linked Empty Item</TableHead>
                      <TableHead className="text-right font-semibold">Deposit Value</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const linkedEmpty = emptyItems.find(e => e.id === product.empty_item_id)
                      return (
                        <TableRow key={product.id} className="hover:bg-emerald-50 transition-colors duration-150">
                          <TableCell className="font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {product.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.sku || '—'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={product.empty_item_id || 'none'}
                              onValueChange={(value) => handleLinkProduct(product.id, value === 'none' ? null : value)}
                              disabled={updating}
                            >
                              <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Select empty item" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">No empty linked</span>
                                </SelectItem>
                                {emptyItems.map((empty) => (
                                  <SelectItem key={empty.id} value={empty.id}>
                                    {empty.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right text-neutral-900">
                            {linkedEmpty ? formatCurrency(linkedEmpty.deposit_value) : '—'}
                          </TableCell>
                          <TableCell>
                            {product.empty_item_id ? (
                              <Badge variant="default" className="bg-success-600 font-medium">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Linked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="font-medium">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Not Linked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!product.empty_item_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCreateDialog(product)}
                                className="hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 border-2"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create Empty
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found. Add products first to link them to empties.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Empty Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Empty Item for Product</DialogTitle>
            <DialogDescription>
              Create a matching empty bottle for "{selectedProduct?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empty-name">Empty Item Name *</Label>
              <Input
                id="empty-name"
                value={newEmptyName}
                onChange={(e) => setNewEmptyName(e.target.value)}
                placeholder="e.g., Coca-Cola 500ml Empty Bottle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-value">Deposit Value (₦) *</Label>
              <Input
                id="deposit-value"
                type="number"
                min="0"
                step="0.01"
                value={newEmptyDeposit}
                onChange={(e) => setNewEmptyDeposit(e.target.value)}
                placeholder="e.g., 50"
              />
              <p className="text-xs text-muted-foreground">
                The value assigned to each empty bottle
              </p>
            </div>

            {newEmptyName && newEmptyDeposit && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium">Summary:</p>
                <p className="text-sm mt-1">
                  Create "{newEmptyName}" with deposit value of {formatCurrency(newEmptyDeposit)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ Will be automatically linked to "{selectedProduct?.name}"
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmptyForProduct} disabled={updating}>
              {updating ? 'Creating...' : 'Create & Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
