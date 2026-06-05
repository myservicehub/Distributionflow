'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Building2, ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  const { userProfile, business } = useAuth()

  return (
    <div className="space-y-8">
      <div className="animate-slide-down">
        <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Settings</h2>
        <p className="text-neutral-600 mt-2">Account and business information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <Card className="border-0 shadow-soft animate-fade-in">
          <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <CardTitle className="text-xl font-bold text-neutral-900">User Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-neutral-600 text-sm">Name</Label>
              <p className="text-lg font-medium text-neutral-900 mt-1">{userProfile?.name}</p>
            </div>
            <div>
              <Label className="text-neutral-600 text-sm">Email</Label>
              <p className="text-lg font-medium text-neutral-900 mt-1">{userProfile?.email}</p>
            </div>
            <div>
              <Label className="text-neutral-600 text-sm">Role</Label>
              <div className="mt-2">
                <Badge variant="default" className="text-sm font-medium">
                  {userProfile?.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-neutral-600 text-sm">Status</Label>
              <div className="mt-2">
                <Badge variant={userProfile?.is_active ? 'default' : 'destructive'} className="text-sm font-medium">
                  {userProfile?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-0 shadow-soft animate-fade-in">
          <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <Building2 className="h-5 w-5 text-success-600" />
              </div>
              <CardTitle className="text-xl font-bold text-neutral-900">Business Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-neutral-600 text-sm">Business Name</Label>
              <p className="text-lg font-medium text-neutral-900 mt-1">{business?.name}</p>
            </div>
            <div>
              <Label className="text-neutral-600 text-sm">Address</Label>
              <p className="text-lg font-medium text-neutral-900 mt-1">{business?.address || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-neutral-600 text-sm">Created</Label>
              <p className="text-lg font-medium text-neutral-900 mt-1">
                {business?.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Permissions */}
      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-xl font-bold text-neutral-900">Your Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {userProfile?.role === 'admin' && (
              <div className="bg-primary-50 border border-primary-200 p-4 rounded-xl">
                <h4 className="font-semibold text-primary-900 mb-2">Admin Access</h4>
                <ul className="list-disc list-inside text-sm text-primary-800 space-y-1">
                  <li>Full access to all features</li>
                  <li>Manage staff and users</li>
                  <li>Edit credit limits</li>
                  <li>Delete records</li>
                  <li>View all reports</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'manager' && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
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
              <div className="bg-success-50 border border-success-200 p-4 rounded-xl">
                <h4 className="font-semibold text-success-900 mb-2">Sales Rep Access</h4>
                <ul className="list-disc list-inside text-sm text-success-800 space-y-1">
                  <li>Create orders</li>
                  <li>Record payments</li>
                  <li>View assigned retailers</li>
                  <li>View products</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'warehouse' && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
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
