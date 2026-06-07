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
        <Card className="border-2 border-neutral-200 shadow-lg animate-fade-in hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-bold text-neutral-900">User Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Name</Label>
              <p className="text-lg font-bold text-neutral-900 mt-1">{userProfile?.name}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Email</Label>
              <p className="text-lg font-semibold text-neutral-900 mt-1">{userProfile?.email}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Role</Label>
              <div className="mt-2">
                <Badge variant="default" className="bg-emerald-600 text-white text-sm font-bold">
                  {userProfile?.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Status</Label>
              <div className="mt-2">
                <Badge 
                  variant={userProfile?.is_active ? 'default' : 'destructive'} 
                  className={`text-sm font-bold ${userProfile?.is_active ? 'bg-success-600' : ''}`}
                >
                  {userProfile?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-2 border-neutral-200 shadow-lg animate-fade-in hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-neutral-900">Business Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Business Name</Label>
              <p className="text-lg font-bold text-neutral-900 mt-1">{business?.name}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Address</Label>
              <p className="text-lg font-semibold text-neutral-900 mt-1">{business?.address || 'Not set'}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <Label className="text-neutral-600 text-xs font-medium uppercase tracking-wide">Created</Label>
              <p className="text-lg font-semibold text-neutral-900 mt-1">
                {business?.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Permissions */}
      <Card className="border-2 border-neutral-200 shadow-lg animate-fade-in hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-purple-50 to-white">
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
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-emerald-900 mb-3 text-lg">Admin Access</h4>
                <ul className="list-disc list-inside text-sm text-emerald-800 space-y-2">
                  <li className="font-medium">Full access to all features</li>
                  <li className="font-medium">Manage staff and users</li>
                  <li className="font-medium">Edit credit limits</li>
                  <li className="font-medium">Delete records</li>
                  <li className="font-medium">View all reports</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'manager' && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-blue-900 mb-3 text-lg">Manager Access</h4>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
                  <li className="font-medium">View all reports</li>
                  <li className="font-medium">Approve orders</li>
                  <li className="font-medium">Confirm stock movements</li>
                  <li className="font-medium">View debts</li>
                  <li className="font-medium">Manage products and retailers</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'sales_rep' && (
              <div className="bg-gradient-to-r from-success-50 to-success-100 border-2 border-success-300 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-success-900 mb-3 text-lg">Sales Rep Access</h4>
                <ul className="list-disc list-inside text-sm text-success-800 space-y-2">
                  <li className="font-medium">Create orders</li>
                  <li className="font-medium">Record payments</li>
                  <li className="font-medium">View assigned retailers</li>
                  <li className="font-medium">View products</li>
                </ul>
              </div>
            )}
            {userProfile?.role === 'warehouse' && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-orange-900 mb-3 text-lg">Warehouse Access</h4>
                <ul className="list-disc list-inside text-sm text-orange-800 space-y-2">
                  <li className="font-medium">Confirm deliveries</li>
                  <li className="font-medium">Record stock in</li>
                  <li className="font-medium">Adjust inventory</li>
                  <li className="font-medium">View products</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
