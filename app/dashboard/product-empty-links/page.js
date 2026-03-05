'use client'

import { useState, useEffect } from 'react'
import { Package, Link2, AlertCircle, CheckCircle, Plus, RefreshCw } from 'lucide-react'
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
  }

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product-Empty Links</h1>
          <p className="text-muted-foreground mt-2">
            Connect products to their corresponding empty bottles
          </p>
        </div>
        <Button onClick={() => loadData()} variant="outline">
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

      {/* Products Table */}
      {products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Product-Empty Mapping</CardTitle>
            <CardDescription>
              Link each product to its corresponding empty bottle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Linked Empty Item</TableHead>
                  <TableHead className="text-right">Deposit Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const linkedEmpty = emptyItems.find(e => e.id === product.empty_item_id)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
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
                      <TableCell className="text-right">
                        {linkedEmpty ? formatCurrency(linkedEmpty.deposit_value) : '—'}
                      </TableCell>
                      <TableCell>
                        {product.empty_item_id ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Linked
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
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
          </CardContent>
        </Card>
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
