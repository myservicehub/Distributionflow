'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
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
import { RefreshCw, ChevronDown, ChevronUp, Calendar, User, Activity } from 'lucide-react'

// Mobile Card Component for Activity Logs
function ActivityLogMobileCard({ log, formatDate, formatAction, getActionBadgeColor }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-bold text-neutral-900 truncate">{log.users?.name || 'System'}</h3>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1 truncate">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                {formatDate(log.created_at)}
              </p>
            </div>
            <Badge className={`${getActionBadgeColor(log.action)} border font-medium text-xs`}>
              {formatAction(log.action)}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
            <span className="text-sm text-neutral-600">Resource:</span>
            <span className="font-medium text-neutral-900 capitalize">{log.resource_type}</span>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              {log.users?.email && (
                <div className="bg-neutral-50 rounded-lg p-2">
                  <p className="text-xs text-neutral-500 mb-1">Email:</p>
                  <p className="text-sm text-neutral-900 break-all">{log.users.email}</p>
                </div>
              )}
              
              {log.details && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-2 font-medium">Details:</p>
                  {log.details.staff_name && (
                    <div className="text-sm text-neutral-700 mb-1">
                      <span className="font-medium">Name:</span> {log.details.staff_name}
                    </div>
                  )}
                  {log.details.staff_email && (
                    <div className="text-sm text-neutral-700 mb-1">
                      <span className="font-medium">Email:</span> {log.details.staff_email}
                    </div>
                  )}
                  {log.details.staff_role && (
                    <div className="text-sm text-neutral-700 mb-1">
                      <span className="font-medium">Role:</span> {log.details.staff_role}
                    </div>
                  )}
                  {log.details.changes && Object.keys(log.details.changes).length > 0 && (
                    <div className="text-xs mt-2 text-neutral-600">
                      <p className="font-medium mb-1">Changes:</p>
                      {Object.entries(log.details.changes).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          {key}: {value.old} → {value.new}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Check if user is admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userProfile, router])

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchLogs()
    }
  }, [userProfile])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/audit-logs?limit=100')
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

  const getActionBadgeColor = (action) => {
    if (action.includes('create')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (action.includes('update')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (action.includes('delete') || action.includes('deactivate')) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-neutral-100 text-neutral-800 border-neutral-200'
  }

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
        <Button onClick={fetchLogs} variant="outline" className="hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 h-12">
          <RefreshCw className="h-5 w-5 mr-2" />
          Refresh
        </Button>
      </div>

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

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden space-y-4 animate-fade-in">
        {logs.length === 0 ? (
          <Card className="border-2 border-neutral-200">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Activity className="h-8 w-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-lg font-medium">No activity logs found</p>
                <p className="text-neutral-500 text-sm mt-1">Activity will appear here as actions are performed</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Recent Activity ({logs.length})</h3>
            </div>
            {logs.map((log) => (
              <ActivityLogMobileCard
                key={log.id}
                log={log}
                formatDate={formatDate}
                formatAction={formatAction}
                getActionBadgeColor={getActionBadgeColor}
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
            <CardTitle className="text-2xl font-bold text-neutral-900">Recent Activity ({logs.length})</CardTitle>
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
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                    <Activity className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 text-lg font-medium">No activity logs found</p>
                  <p className="text-neutral-500 text-sm mt-1">Activity will appear here as actions are performed</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
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
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-neutral-700">{log.resource_type}</TableCell>
                  <TableCell>
                    <div className="text-sm max-w-md text-neutral-700">
                      {log.details?.staff_name && (
                        <div><span className="font-medium text-neutral-900">Name:</span> {log.details.staff_name}</div>
                      )}
                      {log.details?.staff_email && (
                        <div><span className="font-medium text-neutral-900">Email:</span> {log.details.staff_email}</div>
                      )}
                      {log.details?.staff_role && (
                        <div><span className="font-medium text-neutral-900">Role:</span> {log.details.staff_role}</div>
                      )}
                      {log.details?.changes && Object.keys(log.details.changes).length > 0 && (
                        <div className="text-xs mt-1 text-neutral-600">
                          {Object.entries(log.details.changes).map(([key, value]) => (
                            <div key={key}>
                              {key}: {value.old} → {value.new}
                            </div>
                          ))}
                        </div>
                      )}
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
</div>
)
}
