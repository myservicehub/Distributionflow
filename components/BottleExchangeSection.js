'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * BottleExchangeSection Component
 * 
 * Reusable component for recording bottle exchanges
 * Can be used in Order Creation, Delivery Board, etc.
 * 
 * @param {Array} products - List of products being purchased
 * @param {Function} onChange - Callback when exchange data changes
 * @param {Object} value - Current exchange data
 */
export default function BottleExchangeSection({ 
  products = [], 
  onChange, 
  value = { enabled: false, empties: [] },
  emptyItems = []
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [exchangeEnabled, setExchangeEnabled] = useState(value.enabled || false)
  const [emptiesBrought, setEmptiesBrought] = useState(value.empties || [])

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({
        enabled: exchangeEnabled,
        empties: emptiesBrought
      })
    }
  }, [exchangeEnabled, emptiesBrought])

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

  // Calculate deposit
  const calculateDepositInfo = () => {
    if (!products || products.length === 0) {
      return { totalProducts: 0, totalEmpties: 0, shortfall: 0, depositAmount: 0, depositPerUnit: 0 }
    }

    let totalProducts = 0
    let depositPerUnit = 0

    // Count products that need empties and get deposit value
    products.forEach(product => {
      if (product.quantity && product.empty_item_id) {
        totalProducts += parseInt(product.quantity || 0)
        // Get deposit from linked empty
        const empty = emptyItems.find(e => e.id === product.empty_item_id)
        if (empty && !depositPerUnit) {
          depositPerUnit = parseFloat(empty.deposit_value || 0)
        }
      }
    })

    const totalEmpties = emptiesBrought.reduce((sum, e) => 
      sum + (e.quantity ? parseInt(e.quantity) : 0), 0
    )

    const shortfall = Math.max(0, totalProducts - totalEmpties)
    const depositAmount = shortfall * depositPerUnit

    return { totalProducts, totalEmpties, shortfall, depositAmount, depositPerUnit }
  }

  const depositInfo = calculateDepositInfo()
  const formatCurrency = (amount) => `₦${parseFloat(amount).toLocaleString()}`

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Bottle Exchange (Optional)</CardTitle>
                  <CardDescription>
                    Did customer bring empty bottles?
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {exchangeEnabled && depositInfo.totalEmpties > 0 && (
                  <Badge variant="default">
                    {depositInfo.totalEmpties} empties
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Record bottle exchange for this order?</span>
              <Button
                type="button"
                variant={exchangeEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setExchangeEnabled(!exchangeEnabled)
                  if (!exchangeEnabled) {
                    setEmptiesBrought([])
                  }
                }}
              >
                {exchangeEnabled ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Yes, Record Exchange
                  </>
                ) : (
                  'No, Skip Exchange'
                )}
              </Button>
            </div>

            {exchangeEnabled && (
              <>
                {/* Empties Brought Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Empty Bottles Brought</Label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={addEmptyRow}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Empty Type
                    </Button>
                  </div>

                  {emptiesBrought.length === 0 ? (
                    <div className="text-center py-6 bg-muted/30 rounded-lg border-2 border-dashed">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No empties recorded. Full deposit will be charged.
                      </p>
                      <Button 
                        type="button"
                        variant="link" 
                        size="sm" 
                        onClick={addEmptyRow}
                        className="mt-2"
                      >
                        Click to add empties
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emptiesBrought.map((empty, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Select
                              value={empty.empty_item_id}
                              onValueChange={(value) => updateEmptyRow(index, 'empty_item_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select empty type" />
                              </SelectTrigger>
                              <SelectContent>
                                {emptyItems.map(item => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} - {formatCurrency(item.deposit_value)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min="1"
                              value={empty.quantity}
                              onChange={(e) => updateEmptyRow(index, 'quantity', e.target.value)}
                              placeholder="Qty"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmptyRow(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deposit Calculation Summary */}
                {depositInfo.totalProducts > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Deposit Calculation
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Products requiring empties:</span>
                      </div>
                      <div className="text-right font-medium">
                        {depositInfo.totalProducts}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Empties brought:</span>
                      </div>
                      <div className="text-right font-medium text-green-600">
                        {depositInfo.totalEmpties}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Shortfall (need deposit):</span>
                      </div>
                      <div className="text-right font-medium text-orange-600">
                        {depositInfo.shortfall} bottles
                      </div>
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Deposit to Collect:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(depositInfo.depositAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {depositInfo.depositAmount === 0 && depositInfo.totalEmpties > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                        <p className="text-sm text-green-800 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          No deposit needed! Customer brought enough empties.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
