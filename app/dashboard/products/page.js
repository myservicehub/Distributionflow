'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, AlertTriangle, ChevronDown, ChevronUp, Package as PackageIcon, DollarSign, Box } from 'lucide-react'

// Mobile Card Component for Products
function ProductMobileCard({ product, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 10)

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
            {isLowStock && (
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            )}
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-3 py-2 border-y border-neutral-200">
            <div>
              <p className="text-xs text-neutral-500">Selling Price</p>
              <p className="font-bold text-neutral-900">₦{parseFloat(product.selling_price || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Stock</p>
              <p className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-neutral-900'}`}>
                {product.stock_quantity} units
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
                <span className="text-neutral-600">Low Stock Alert:</span>
                <span className="font-medium text-neutral-900">{product.low_stock_threshold || 10} units</span>
              </div>
              {isLowStock && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                  <p className="text-xs font-medium text-orange-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Low stock warning - only {product.stock_quantity} units remaining
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 hover:bg-primary-50"
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(product)}
              className="hover:bg-primary-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    cost_price: '0',
    selling_price: '0',
    stock_quantity: '0',
    low_stock_threshold: '10'
  })
  const supabase = createClient()

  useEffect(() => {
    const controller = new AbortController()
    
    loadProducts(controller.signal)
    
    return () => controller.abort()
  }, [])

  const loadProducts = async (signal) => {
    try {
      const response = await fetch('/api/products', { signal })
      if (!response.ok) throw new Error('Failed to load products')
      const responseData = await response.json()
      // Handle both old format (array) and new format (object with data property)
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      setProducts(data)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading products:', error)
        toast.error('Failed to load products')
      }
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save product')

      toast.success(editingProduct ? 'Product updated!' : 'Product created!')
      setDialogOpen(false)
      resetForm()
      loadProducts()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku || '',
      cost_price: product.cost_price?.toString() || '0',
      selling_price: product.selling_price?.toString() || '0',
      stock_quantity: product.stock_quantity?.toString() || '0',
      low_stock_threshold: product.low_stock_threshold?.toString() || '10'
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete product')

      toast.success('Product deleted!')
      loadProducts()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      cost_price: '0',
      selling_price: '0',
      stock_quantity: '0',
      low_stock_threshold: '10'
    })
    setEditingProduct(null)
  }

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
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Products</h2>
          <p className="text-neutral-600 mt-2">Manage your inventory and stock levels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group h-12">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Create a new product'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price">Cost Price (₦)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="selling_price">Selling Price (₦) *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <CardTitle className="text-2xl font-bold text-neutral-900">All Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table aria-label="Data table">
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold">Product Name</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Cost Price</TableHead>
                  <TableHead className="font-semibold">Selling Price</TableHead>
                  <TableHead className="font-semibold">Stock</TableHead>
                  <TableHead className="font-semibold">Low Stock Alert</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isLowStock = product.stock_quantity <= product.low_stock_threshold
                  return (
                    <TableRow key={product.id} className="hover:bg-neutral-50 transition-colors duration-150">
                      <TableCell className="font-medium text-neutral-900">{product.name}</TableCell>
                      <TableCell className="text-neutral-700">{product.sku || '-'}</TableCell>
                      <TableCell className="text-neutral-900">₦{parseFloat(product.cost_price || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-neutral-900 font-medium">₦{parseFloat(product.selling_price || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={isLowStock ? 'text-orange-600 font-semibold' : 'text-neutral-900'}>
                            {product.stock_quantity}
                          </span>
                          {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-700">{product.low_stock_threshold}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {products.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">No products yet</p>
                <p className="text-neutral-500 text-sm mt-1">Click "Add Product" to create your first product</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {products.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">No products yet</p>
                <p className="text-neutral-500 text-sm mt-1">Click "Add Product" to create your first product</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {products.map((product) => (
                  <ProductMobileCard
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
