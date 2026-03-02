'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [debtAging, setDebtAging] = useState([])
  const [salesByRep, setSalesByRep] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      // Load debt aging
      const debtResponse = await fetch('/api/reports/debt-aging')
      if (debtResponse.ok) {
        const debtData = await debtResponse.json()
        setDebtAging(debtData)
      }

      // Load sales by rep
      const salesResponse = await fetch('/api/reports/sales-by-rep')
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        setSalesByRep(salesData)
      }

      // Load inventory
      const inventoryResponse = await fetch('/api/reports/inventory')
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        setInventory(inventoryData)
      }
    } catch (error) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
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
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-600 mt-2">Business analytics and insights</p>
      </div>

      <Tabs defaultValue="debt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="debt">Debt Aging</TabsTrigger>
          <TabsTrigger value="sales">Sales by Rep</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
        </TabsList>

        {/* Debt Aging Report */}
        <TabsContent value="debt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debt Aging Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Retailer</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Aging Category</TableHead>
                      <TableHead>Days Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtAging.map((item) => (
                      <TableRow key={item.shop_name}>
                        <TableCell className="font-medium">{item.shop_name}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          ₦{parseFloat(item.current_balance).toLocaleString()}
                        </TableCell>
                        <TableCell>₦{parseFloat(item.credit_limit).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.aging_category === '90+ days' ? 'bg-red-100 text-red-800' :
                            item.aging_category === '60-90 days' ? 'bg-orange-100 text-orange-800' :
                            item.aging_category === '30-60 days' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.aging_category}
                          </span>
                        </TableCell>
                        <TableCell>{item.days_outstanding} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {debtAging.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No outstanding debts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Rep Report */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance by Representative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sales Representative</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Items Sold</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Average Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByRep.map((rep, idx) => (
                      <TableRow key={`${rep.name}-${idx}`}>
                        <TableCell className="font-medium">{rep.name}</TableCell>
                        <TableCell>{rep.orders}</TableCell>
                        <TableCell className="font-semibold text-blue-600">{rep.items || 0}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₦{parseFloat(rep.total).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₦{(parseFloat(rep.total) / rep.orders).toLocaleString(undefined, {maximumFractionDigits: 2})}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {salesByRep.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock Quantity</TableHead>
                      <TableHead>Low Stock Alert</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((product) => {
                      const stockValue = product.stock_quantity * parseFloat(product.cost_price || 0)
                      const isLowStock = product.stock_quantity <= product.low_stock_threshold
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku || '-'}</TableCell>
                          <TableCell className={isLowStock ? 'text-orange-600 font-semibold' : ''}>
                            {product.stock_quantity}
                          </TableCell>
                          <TableCell>{product.low_stock_threshold}</TableCell>
                          <TableCell>₦{parseFloat(product.cost_price || 0).toLocaleString()}</TableCell>
                          <TableCell>₦{parseFloat(product.selling_price || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold">₦{stockValue.toLocaleString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {inventory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No inventory data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          {inventory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-blue-600">{inventory.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Stock Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{inventory.reduce((sum, p) => sum + (p.stock_quantity * parseFloat(p.cost_price || 0)), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {inventory.filter(p => p.stock_quantity <= p.low_stock_threshold).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
