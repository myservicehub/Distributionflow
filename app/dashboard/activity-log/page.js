'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 mt-1">Track all actions performed in your business</p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.users?.name || 'System'}</div>
                      <div className="text-xs text-gray-500">{log.users?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{log.resource_type}</TableCell>
                  <TableCell>
                    <div className="text-sm max-w-md">
                      {log.details?.staff_name && (
                        <div><span className="font-medium">Name:</span> {log.details.staff_name}</div>
                      )}
                      {log.details?.staff_email && (
                        <div><span className="font-medium">Email:</span> {log.details.staff_email}</div>
                      )}
                      {log.details?.staff_role && (
                        <div><span className="font-medium">Role:</span> {log.details.staff_role}</div>
                      )}
                      {log.details?.changes && Object.keys(log.details.changes).length > 0 && (
                        <div className="text-xs mt-1 text-gray-600">
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
    </div>
  )
}
