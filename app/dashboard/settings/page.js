'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const { userProfile, business } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Account and business information</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-600">Name</Label>
            <p className="text-lg font-medium">{userProfile?.name}</p>
          </div>
          <div>
            <Label className="text-gray-600">Email</Label>
            <p className="text-lg font-medium">{userProfile?.email}</p>
          </div>
          <div>
            <Label className="text-gray-600">Role</Label>
            <div className="mt-2">
              <Badge variant="default" className="text-sm">
                {userProfile?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-gray-600">Status</Label>
            <div className="mt-2">
              <Badge variant={userProfile?.is_active ? 'default' : 'destructive'} className="text-sm">
                {userProfile?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-600">Business Name</Label>
            <p className="text-lg font-medium">{business?.name}</p>
          </div>
          <div>
            <Label className="text-gray-600">Address</Label>
            <p className="text-lg font-medium">{business?.address || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Created</Label>
            <p className="text-lg font-medium">
              {business?.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userProfile?.role === 'admin' && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">Admin Access</h4>
                <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
                  <li>Full access to all features</li>
                  <li>Manage staff and users</li>
                  <li>Edit credit limits</li>
                  <li>Delete records</li>
                  <li>View all reports</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'manager' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Manager Access</h4>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>View all reports</li>
                  <li>Approve orders</li>
                  <li>Confirm stock movements</li>
                  <li>View debts</li>
                  <li>Manage products and retailers</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'sales_rep' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Sales Rep Access</h4>
                <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                  <li>Create orders</li>
                  <li>Record payments</li>
                  <li>View assigned retailers</li>
                  <li>View products</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'warehouse' && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Warehouse Access</h4>
                <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                  <li>Confirm deliveries</li>
                  <li>Record stock in</li>
                  <li>Adjust inventory</li>
                  <li>View products</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
