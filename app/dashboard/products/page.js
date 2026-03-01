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
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'

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
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to load products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 mt-2">Manage your inventory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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

      <Card>
        <CardHeader>
          <CardTitle>All Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Low Stock Alert</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isLowStock = product.stock_quantity <= product.low_stock_threshold
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>₦{parseFloat(product.cost_price || 0).toLocaleString()}</TableCell>
                      <TableCell>₦{parseFloat(product.selling_price || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={isLowStock ? 'text-orange-600 font-semibold' : ''}>
                            {product.stock_quantity}
                          </span>
                          {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        </div>
                      </TableCell>
                      <TableCell>{product.low_stock_threshold}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
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
              <div className="text-center py-8 text-gray-500">
                No products yet. Click "Add Product" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
