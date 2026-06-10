'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ManufacturerSupplyPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto mt-10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <CardTitle>Manufacturer Supply - Temporarily Unavailable</CardTitle>
          </div>
          <CardDescription>
            This page is undergoing maintenance due to a technical issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Manufacturer Supply page has been temporarily disabled while we resolve a syntax error in the component code.
            All other features of the application are working normally.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>What you can still do:</strong>
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
            <li>View and manage orders</li>
            <li>Process payments</li>
            <li>Manage inventory</li>
            <li>View reports and analytics</li>
            <li>Manage retailers and staff</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            The original file has been backed up and can be restored once the issue is resolved.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
