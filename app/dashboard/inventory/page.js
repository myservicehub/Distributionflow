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
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus, ArrowUpCircle, ArrowDownCircle, Warehouse, ChevronDown, ChevronUp, Box, Calendar, FileText } from 'lucide-react'

// Mobile Card Components
function ProductMobileCard({ product }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 10)
  const isOutOfStock = product.stock_quantity === 0

  return (
    <Card className="border-2 border-neutral-200 hover:border-primary-200 transition-all">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Box className="h-4 w-4 text-primary-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{product.name}</h3>
              </div>
              {product.sku && (
                <p className="text-xs text-neutral-500">SKU: {product.sku}</p>
              )}
            </div>
            <Badge variant={isOutOfStock ? 'destructive' : isLowStock ? 'default' : 'default'} 
                   className={`font-medium flex-shrink-0 ${
                     isOutOfStock ? '' : isLowStock ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-success-100 text-success-700 border-success-200'
                   }`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
            </Badge>
          </div>

          {/* Stock Info */}
          <div className="flex items-center justify-between py-2 border-y border-neutral-200">
            <div>
              <p className="text-xs text-neutral-500">Stock Quantity</p>
              <p className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-neutral-900'}`}>
                {product.stock_quantity || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Threshold</p>
              <p className="text-lg font-semibold text-neutral-700">
                {product.low_stock_threshold || 10}
              </p>
            </div>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Cost Price:</span>
                <span className="font-medium text-neutral-900">₦{parseFloat(product.cost_price || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Selling Price:</span>
                <span className="font-medium text-neutral-900">₦{parseFloat(product.selling_price || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Stock Value:</span>
                <span className="font-bold text-primary-600">
                  ₦{((product.stock_quantity || 0) * (product.cost_price || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* View More Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-primary-50"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StockMovementMobileCard({ movement }) {
  return (
    <Card className="border-2 border-neutral-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-neutral-900 truncate">{movement.product?.name || 'Unknown Product'}</h3>
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(movement.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={movement.type === 'in' ? 'default' : 'destructive'} 
                   className={`font-medium flex-shrink-0 ${
                     movement.type === 'in' ? 'bg-success-100 text-success-700 border-success-200' : ''
                   }`}>
              {movement.type === 'in' ? (
                <>
                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                  Stock In
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                  Stock Out
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-neutral-200">
            <span className="text-sm text-neutral-600">Quantity:</span>
            <span className="text-lg font-bold text-neutral-900">{movement.quantity}</span>
          </div>

          {movement.notes && (
            <div className="bg-neutral-50 rounded-lg p-2">
              <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notes:
              </p>
              <p className="text-sm text-neutral-700">{movement.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

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
    const controller = new AbortController()
    
    loadData(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadData = async (signal) => {
    try {
      const [productsRes, movementsRes] = await Promise.all([
        fetch('/api/products', { signal }),
        fetch('/api/stock-movements', { signal })
      ])

      if (!productsRes.ok) throw new Error('Failed to load products')
      if (!movementsRes.ok) throw new Error('Failed to load stock movements')

      const productsResponseData = await productsRes.json()
      const movementsResponseData = await movementsRes.json()

      // Handle both old format (array) and new format (object with data property)
      const productsData = Array.isArray(productsResponseData) ? productsResponseData : (productsResponseData.data || [])
      const movementsData = Array.isArray(movementsResponseData) ? movementsResponseData : (movementsResponseData.data || [])

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" role="status" aria-label="Loading"><span className="sr-only">Loading...</span></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-slide-down">
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Inventory Management</h2>
          <p className="text-neutral-600 mt-2">Track and manage stock levels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group h-12">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
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
                  <p className="text-sm text-neutral-600">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-scale-in">
        <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Products</CardTitle>
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">{products.length}</div>
            <p className="text-xs text-neutral-500 mt-1">
              Active SKUs in inventory
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Value</CardTitle>
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">₦{totalValue.toLocaleString()}</div>
            <p className="text-xs text-neutral-500 mt-1">
              Based on cost price
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Low Stock Items</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-neutral-500 mt-1">
              Below threshold level
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Out of Stock</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outOfStockProducts.length}</div>
            <p className="text-xs text-neutral-500 mt-1">
              Requires immediate restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="bg-white border border-neutral-200 p-1">
          <TabsTrigger value="current" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">Current Stock</TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card className="border-0 shadow-soft animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Warehouse className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-neutral-900">Current Stock Levels</CardTitle>
                  <CardDescription className="text-neutral-600">Overview of all products and their stock quantities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table aria-label="Data table">
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">SKU</TableHead>
                      <TableHead className="text-right font-semibold">Stock Qty</TableHead>
                      <TableHead className="text-right font-semibold">Threshold</TableHead>
                      <TableHead className="text-right font-semibold">Value</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                            <Package className="h-8 w-8 text-neutral-400" />
                          </div>
                          <p className="text-neutral-600 text-lg font-medium">No products found</p>
                          <p className="text-neutral-500 text-sm mt-1">Add products to track inventory</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map(product => (
                        <TableRow key={product.id} className="hover:bg-neutral-50 transition-colors duration-150">
                          <TableCell className="font-medium text-neutral-900">{product.name}</TableCell>
                          <TableCell className="text-neutral-700">{product.sku || '-'}</TableCell>
                          <TableCell className="text-right text-neutral-900 font-medium">{product.stock_quantity || 0}</TableCell>
                          <TableCell className="text-right text-neutral-700">{product.low_stock_threshold || 10}</TableCell>
                          <TableCell className="text-right text-neutral-900 font-medium">
                            ₦{((product.stock_quantity || 0) * (product.cost_price || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {product.stock_quantity === 0 ? (
                              <Badge variant="destructive" className="font-medium">Out of Stock</Badge>
                            ) : product.stock_quantity <= (product.low_stock_threshold || 10) ? (
                              <Badge className="bg-orange-100 text-orange-700 border border-orange-200 font-medium">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-success-100 text-success-700 border border-success-200 font-medium">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Current Stock */}
              <div className="md:hidden p-4 space-y-4">
                {products.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                      <Package className="h-8 w-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-600 text-lg font-medium">No products found</p>
                    <p className="text-neutral-500 text-sm mt-1">Add products to track inventory</p>
                  </div>
                ) : (
                  products.map(product => (
                    <ProductMobileCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card className="border-0 shadow-soft animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
              <CardTitle className="text-2xl font-bold text-neutral-900">Stock Movement History</CardTitle>
              <CardDescription className="text-neutral-600">Recent stock in and out transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table - Stock Movements */}
              <div className="hidden md:block overflow-x-auto">
                <Table aria-label="Data table">
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="text-right font-semibold">Quantity</TableHead>
                      <TableHead className="font-semibold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                            <Plus className="h-8 w-8 text-neutral-400" />
                          </div>
                          <p className="text-neutral-600 text-lg font-medium">No stock movements recorded</p>
                          <p className="text-neutral-500 text-sm mt-1">Stock movements will appear here</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockMovements.slice(0, 50).map(movement => (
                        <TableRow key={movement.id} className="hover:bg-neutral-50 transition-colors duration-150">
                          <TableCell className="text-neutral-700">
                            {new Date(movement.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900">
                            {movement.product?.name || 'Unknown Product'}
                          </TableCell>
                          <TableCell>
                            {movement.type === 'in' ? (
                              <Badge className="bg-success-100 text-success-700 border border-success-200 font-medium">
                                <ArrowUpCircle className="h-3 w-3 mr-1" />
                                Stock In
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="font-medium">
                                <ArrowDownCircle className="h-3 w-3 mr-1" />
                                Stock Out
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-neutral-900 font-medium">{movement.quantity}</TableCell>
                          <TableCell className="text-sm text-neutral-600">
                            {movement.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Stock Movements */}
              <div className="md:hidden p-4 space-y-4">
                {stockMovements.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                      <Plus className="h-8 w-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-600 text-lg font-medium">No stock movements recorded</p>
                    <p className="text-neutral-500 text-sm mt-1">Stock movements will appear here</p>
                  </div>
                ) : (
                  stockMovements.slice(0, 50).map(movement => (
                    <StockMovementMobileCard key={movement.id} movement={movement} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="border-0 shadow-soft animate-fade-in">
            <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
              <CardTitle className="text-2xl font-bold text-neutral-900">Stock Alerts</CardTitle>
              <CardDescription className="text-neutral-600">Products requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                    <Package className="h-8 w-8 text-success-600" />
                  </div>
                  <p className="text-neutral-900 text-lg font-medium">No stock alerts at the moment</p>
                  <p className="text-neutral-500 text-sm mt-1">All products are adequately stocked</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {outOfStockProducts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Out of Stock ({outOfStockProducts.length})
                      </h3>
                      <div className="space-y-3">
                        {outOfStockProducts.map(product => (
                          <div key={product.id} className="flex items-center justify-between p-4 border-2 border-red-200 rounded-xl bg-red-50 hover:shadow-soft transition-all">
                            <div>
                              <p className="font-medium text-neutral-900">{product.name}</p>
                              <p className="text-sm text-neutral-600">SKU: {product.sku || '-'}</p>
                            </div>
                            <Badge variant="destructive" className="font-medium">0 units</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lowStockProducts.filter(p => p.stock_quantity > 0).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg text-orange-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Low Stock ({lowStockProducts.filter(p => p.stock_quantity > 0).length})
                      </h3>
                      <div className="space-y-3">
                        {lowStockProducts.filter(p => p.stock_quantity > 0).map(product => (
                          <div key={product.id} className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-xl bg-orange-50 hover:shadow-soft transition-all">
                            <div>
                              <p className="font-medium text-neutral-900">{product.name}</p>
                              <p className="text-sm text-neutral-600">
                                SKU: {product.sku || '-'} • Threshold: {product.low_stock_threshold || 10}
                              </p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700 border border-orange-300 font-medium">
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
