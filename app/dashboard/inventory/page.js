'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export default function InventoryPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'in',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, movementsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stock-movements')
      ])

      if (!productsRes.ok) throw new Error('Failed to load products')
      if (!movementsRes.ok) throw new Error('Failed to load stock movements')

      const productsData = await productsRes.json()
      const movementsData = await movementsRes.json()

      setProducts(productsData)
      setStockMovements(movementsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record stock movement')
      }

      toast.success('Stock movement recorded!')
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: '',
      movement_type: 'in',
      quantity: '',
      notes: ''
    })
    setSelectedProduct(null)
  }

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product)
    setFormData(prev => ({ ...prev, product_id: productId }))
  }

  // Calculate inventory stats
  const lowStockProducts = products.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 10)
  )
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0)
  const totalValue = products.reduce((sum, p) => 
    sum + (p.stock_quantity * (p.cost_price || 0)), 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock levels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Stock Movement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
              <DialogDescription>
                Add or remove stock for a product
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={handleProductSelect}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - Current Stock: {product.stock_quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movement_type">Movement Type *</Label>
                <Select
                  value={formData.movement_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Add)</SelectItem>
                    <SelectItem value="out">Stock Out (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground">
                    Current stock: {selectedProduct.stock_quantity} units
                    {formData.quantity && formData.movement_type === 'in' && (
                      <> → New stock: {selectedProduct.stock_quantity + parseInt(formData.quantity || 0)} units</>
                    )}
                    {formData.quantity && formData.movement_type === 'out' && (
                      <> → New stock: {selectedProduct.stock_quantity - parseInt(formData.quantity || 0)} units</>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reason for stock movement"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit">Record Movement</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active SKUs in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on cost price
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Below threshold level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Stock</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Stock Levels</CardTitle>
              <CardDescription>Overview of all products and their stock quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock Qty</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell className="text-right">{product.stock_quantity || 0}</TableCell>
                        <TableCell className="text-right">{product.low_stock_threshold || 10}</TableCell>
                        <TableCell className="text-right">
                          ₦{((product.stock_quantity || 0) * (product.cost_price || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {product.stock_quantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : product.stock_quantity <= (product.low_stock_threshold || 10) ? (
                            <Badge variant="warning" className="bg-yellow-500">Low Stock</Badge>
                          ) : (
                            <Badge variant="success" className="bg-green-500">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>Recent stock in and out transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No stock movements recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockMovements.slice(0, 50).map(movement => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.product?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell>
                          {movement.movement_type === 'in' ? (
                            <Badge variant="success" className="bg-green-500">
                              <ArrowUpCircle className="h-3 w-3 mr-1" />
                              Stock In
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <ArrowDownCircle className="h-3 w-3 mr-1" />
                              Stock Out
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{movement.quantity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Products requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No stock alerts at the moment</p>
                  <p className="text-sm">All products are adequately stocked</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outOfStockProducts.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Out of Stock ({outOfStockProducts.length})
                      </h3>
                      <div className="space-y-2">
                        {outOfStockProducts.map(product => (
                          <div key={product.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">SKU: {product.sku || '-'}</p>
                            </div>
                            <Badge variant="destructive">0 units</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lowStockProducts.filter(p => p.stock_quantity > 0).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Low Stock ({lowStockProducts.filter(p => p.stock_quantity > 0).length})
                      </h3>
                      <div className="space-y-2">
                        {lowStockProducts.filter(p => p.stock_quantity > 0).map(product => (
                          <div key={product.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku || '-'} • Threshold: {product.low_stock_threshold || 10}
                              </p>
                            </div>
                            <Badge variant="warning" className="bg-yellow-500">
                              {product.stock_quantity} units
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
