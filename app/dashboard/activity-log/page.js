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
import { RefreshCw } from 'lucide-react'

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
    if (action.includes('created')) return 'bg-green-100 text-green-700'
    if (action.includes('updated')) return 'bg-blue-100 text-blue-700'
    if (action.includes('deleted') || action.includes('deactivated')) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

      <Card className="border-0 shadow-soft animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <CardTitle className="text-2xl font-bold text-neutral-900">Recent Activity</CardTitle>
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
                  <p className="text-neutral-600 text-lg font-medium">No activity logs found</p>
                  <p className="text-neutral-500 text-sm mt-1">Activity will appear here as actions are performed</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-neutral-50 transition-colors duration-150">
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
