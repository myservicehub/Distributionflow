'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Eye } from 'lucide-react'
import Link from 'next/link'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [filteredBusinesses, setFilteredBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchBusinesses()
  }, [])

  useEffect(() => {
    filterBusinesses()
  }, [searchTerm, statusFilter, businesses])

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/platform?route=businesses')
      const data = await res.json()
      if (data.success) {
        setBusinesses(data.data)
        setFilteredBusinesses(data.data)
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBusinesses = () => {
    let filtered = businesses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.owner_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.subscription_status === statusFilter)
    }

    setFilteredBusinesses(filtered)
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: 'default', label: 'Active' },
      trial: { variant: 'secondary', label: 'Trial' },
      expired: { variant: 'destructive', label: 'Expired' },
      cancelled: { variant: 'outline', label: 'Cancelled' }
    }
    const config = variants[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getHealthBadge = (score) => {
    if (!score) return null
    if (score >= 70) return <Badge className="bg-green-100 text-green-700">🟢 Healthy</Badge>
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-700">🟡 Moderate</Badge>
    return <Badge className="bg-red-100 text-red-700">🔴 At Risk</Badge>
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
        <p className="text-gray-500 mt-2">Manage all businesses on the platform</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'trial', 'active', 'expired'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Businesses ({filteredBusinesses.length})</CardTitle>
          <CardDescription>Click on a business to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Business Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Active Users</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Health</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No businesses found
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business) => (
                    <tr key={business.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-500">{business.address}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{business.plans?.display_name || 'N/A'}</div>
                          <div className="text-gray-500">
                            ₦{business.plans?.base_price?.toLocaleString() || 0}/mo
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(business.subscription_status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{business.active_users || 0}</div>
                          <div className="text-gray-500">
                            of {business.plans?.included_users || 0} included
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getHealthBadge(business.health_score)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(business.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <Link href={`/platform/businesses/${business.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
