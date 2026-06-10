'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, ChevronDown, ChevronUp, Calendar, User, Activity, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { DateRangeFilter, getDateRangeStart } from '@/components/ui/date-range-filter'

// Mobile Card Component for Activity Logs
function ActivityLogMobileCard({ log, formatDate, formatAction, getActionBadgeColor, getDetailedDescription }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 text-sm">{log.users?.name || 'System'}</h3>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                {formatDate(log.created_at)}
              </p>
            </div>
            <Badge className={`${getActionBadgeColor(log.action)} border font-medium text-xs flex-shrink-0`}>
              {formatAction(log.action, log.entity_type, log.details)}
            </Badge>
          </div>

          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-sm text-neutral-900 font-medium">{getDetailedDescription(log)}</p>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              {log.users?.email && (
                <div className="bg-neutral-50 rounded-lg p-2">
                  <p className="text-xs text-neutral-500 mb-1">Performed by:</p>
                  <p className="text-sm text-neutral-900 break-all">{log.users.email}</p>
                </div>
              )}
              
              <div className="bg-neutral-50 rounded-lg p-2">
                <p className="text-xs text-neutral-500 mb-1">Resource Type:</p>
                <p className="text-sm text-neutral-900 capitalize">{log.entity_type}</p>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full hover:bg-emerald-50 hover:border-emerald-300 border-2 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-4 w-4 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" />View More</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ActivityLogPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15
  const [dateRange, setDateRange] = useState(searchParams.get('range') || '30d')

  // Helper to get human-readable range label
  const rangeLabel = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    all: 'All Time'
  }[dateRange]

  // Check if user has permission (admin or manager)
  useEffect(() => {
    if (userProfile && !['admin', 'manager'].includes(userProfile.role)) {
      router.push('/dashboard')
    }
  }, [userProfile, router])

  useEffect(() => {
    if (userProfile && ['admin', 'manager'].includes(userProfile.role)) {
      fetchLogs()
    }
  }, [userProfile])

  const fetchLogs = async (range = dateRange) => {
    setLoading(true)
    try {
      const start = getDateRangeStart(range)
      const params = new URLSearchParams({ limit: '500' })
      if (start) params.set('from', start.toISOString())

      const response = await fetch(`/api/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (range) => {
    setDateRange(range)
    setCurrentPage(1)

    const params = new URLSearchParams(searchParams)
    params.set('range', range)
    router.replace(`${pathname}?${params}`, { scroll: false })

    fetchLogs(range)
  }

  const getActionBadgeColor = (action) => {
    if (action.includes('create')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (action.includes('update')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (action.includes('delete') || action.includes('deactivate')) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-neutral-100 text-neutral-800 border-neutral-200'
  }

  const formatAction = (action, entityType, details) => {
    // Parse details if it's a string
    const detailsObj = typeof details === 'string' ? JSON.parse(details) : details || {}
    
    // Create user-friendly action descriptions
    const actionMap = {
      // Order actions
      'create_order': 'New Order Created',
      'create': {
        'order': 'New Order Created',
        'product': 'New Product Added',
        'retailer': 'New Retailer Onboarded',
        'payment': 'Payment Recorded',
        'user': 'New Staff Member Added',
        'staff': 'New Staff Member Added',
      },
      'update': {
        'order': detailsObj.action === 'approve' ? 'Order Approved' :
                 detailsObj.action === 'reject' ? 'Order Rejected' :
                 detailsObj.action === 'pack' ? 'Order Packed' :
                 detailsObj.action === 'dispatch' ? 'Order Dispatched' :
                 detailsObj.action === 'deliver' ? 'Order Delivered' :
                 detailsObj.action === 'fail_delivery' ? 'Delivery Failed' :
                 'Order Updated',
        'product': 'Product Updated',
        'retailer': detailsObj.field_changed === 'credit_limit' ? 'Credit Limit Changed' : 'Retailer Information Updated',
        'payment': 'Payment Modified',
        'user': 'Staff Details Updated',
        'staff': 'Staff Details Updated',
      },
      'delete': {
        'order': 'Order Deleted',
        'product': 'Product Removed',
        'retailer': 'Retailer Removed',
        'payment': 'Payment Deleted',
        'user': 'Staff Removed',
        'staff': 'Staff Removed',
      },
      // Staff specific actions
      'staff_created': 'New Staff Member Added',
      'staff_updated': 'Staff Details Updated',
      'staff_deactivated': 'Staff Account Deactivated',
      'staff_reactivated': 'Staff Account Reactivated',
      // Legacy actions
      'CREATE_RETAILER': 'New Retailer Onboarded',
      'UPDATE_CREDIT_LIMIT': 'Credit Limit Changed',
    }

    // Check if it's a compound action (action + entity_type)
    if (actionMap[action] && typeof actionMap[action] === 'object') {
      return actionMap[action][entityType] || `${action.replace(/_/g, ' ')} ${entityType}`.replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Check if it's a direct action
    if (actionMap[action]) {
      return actionMap[action]
    }
    
    // Fallback: capitalize and format
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDetailedDescription = (log) => {
    const detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details || {}
    const action = log.action
    const entityType = log.entity_type

    // Generate detailed descriptions for different actions
    switch (action) {
      case 'create':
        if (entityType === 'order') {
          return `Order created for ${detailsObj.retailer_name || 'retailer'} - Amount: ₦${parseFloat(detailsObj.total_amount || 0).toLocaleString()}`
        }
        if (entityType === 'product') {
          return `Added "${detailsObj.name}" - Price: ₦${parseFloat(detailsObj.selling_price || 0).toLocaleString()}`
        }
        if (entityType === 'retailer') {
          return `Onboarded ${detailsObj.shop_name || 'new retailer'}`
        }
        if (entityType === 'payment') {
          return `Recorded payment of ₦${parseFloat(detailsObj.amount || 0).toLocaleString()} via ${detailsObj.payment_method || 'unknown method'}`
        }
        break

      case 'update':
        if (entityType === 'order') {
          if (detailsObj.action === 'approve') return `Approved order and moved to preparing status`
          if (detailsObj.action === 'reject') return `Rejected and cancelled order`
          if (detailsObj.action === 'pack') return `Marked order as packed and ready`
          if (detailsObj.action === 'dispatch') return `Dispatched order${detailsObj.driver_name ? ` with driver ${detailsObj.driver_name}` : ''}`
          if (detailsObj.action === 'deliver') return `Confirmed order delivery to retailer`
          return `Updated order status`
        }
        if (entityType === 'product') {
          return `Updated "${detailsObj.name}" details`
        }
        if (entityType === 'retailer') {
          if (detailsObj.field_changed === 'credit_limit') {
            return `Changed credit limit to ₦${parseFloat(detailsObj.credit_limit || 0).toLocaleString()}`
          }
          return `Updated ${detailsObj.shop_name || 'retailer'} information`
        }
        break

      case 'delete':
        if (entityType === 'retailer') {
          return `Removed ${detailsObj.shop_name || 'retailer'} from system`
        }
        if (entityType === 'product') {
          return `Removed "${detailsObj.name || 'product'}" from inventory`
        }
        break

      case 'staff_created':
        return `Added ${detailsObj.staff_name || 'new staff'} as ${detailsObj.staff_role || 'staff member'}`
      
      case 'staff_updated':
        return `Updated ${detailsObj.staff_name || 'staff'} details`
      
      case 'staff_deactivated':
        return `Deactivated ${detailsObj.staff_name || 'staff'} account`
      
      case 'staff_reactivated':
        return `Reactivated ${detailsObj.staff_name || 'staff'} account`
    }

    // Fallback to basic entity type
    return `Modified ${entityType || 'record'}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs

    const lowerSearch = searchTerm.toLowerCase()
    return logs.filter(log =>
      log.users?.name?.toLowerCase().includes(lowerSearch) ||
      log.users?.email?.toLowerCase().includes(lowerSearch) ||
      log.action?.toLowerCase().includes(lowerSearch) ||
      log.entity_type?.toLowerCase().includes(lowerSearch) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(lowerSearch)
    )
  }, [logs, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredLogs.slice(startIndex, startIndex + pageSize)
  }, [filteredLogs, currentPage, pageSize])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-slide-down">
          <h2 className="text-4xl font-bold text-neutral-900 tracking-tight">Activity Log</h2>
          <p className="text-neutral-600 mt-2">Track all actions performed in your business</p>
        </div>
        <Button 
          onClick={fetchLogs} 
          variant="outline" 
          className="hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 border-2 h-12 w-full sm:w-auto"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filter bar — date + search */}
      <div className="flex flex-col gap-3">
        {/* Date range filter */}
        <DateRangeFilter value={dateRange} onChange={handleDateChange} />

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by user, action, or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-neutral-200 focus:border-emerald-400 transition-colors"
          />
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4 animate-fade-in">
        {paginatedLogs.length === 0 ? (
          <Card className="border-2 border-neutral-200">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Activity className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">
                  {searchTerm ? 'No matching activities' : 'No activity logs in the selected period'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {searchTerm ? 'Try different search terms' :
                   dateRange !== 'all' ? 'Try selecting a longer date range or "All time"' :
                   'Activity will appear here as actions are performed'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Recent Activity · {rangeLabel}</h3>
            </div>
            {paginatedLogs.map((log) => (
              <ActivityLogMobileCard
                key={log.id}
                log={log}
                formatDate={formatDate}
                formatAction={formatAction}
                getActionBadgeColor={getActionBadgeColor}
                getDetailedDescription={getDetailedDescription}
              />
            ))}
          </>
        )}
      </div>

      {/* Desktop View - Table Layout */}
      <Card className="hidden md:block border-2 border-neutral-200 shadow-lg animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Recent Activity · {rangeLabel}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-semibold">Date & Time</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Resource</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                    <Activity className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 text-lg font-medium">
                    {searchTerm ? 'No logs found' : 'No activity logs yet'}
                  </p>
                  <p className="text-neutral-500 text-sm mt-1">
                    {searchTerm ? 'Try adjusting your search' : 'Activity will appear here as actions are performed'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-emerald-50 transition-colors duration-150">
                  <TableCell className="text-sm text-neutral-700">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-neutral-900">{log.users?.name || 'System'}</div>
                      <div className="text-xs text-neutral-500">{log.users?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getActionBadgeColor(log.action)} border font-medium`}>
                      {formatAction(log.action, log.entity_type, log.details)}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-neutral-700">{log.entity_type}</TableCell>
                  <TableCell>
                    <div className="text-sm max-w-md text-neutral-900 font-medium">
                      {getDetailedDescription(log)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>

  {/* Pagination */}
  {totalPages > 1 && (
    <div className="flex justify-center mt-6 animate-fade-in">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )}
</div>
)
}
