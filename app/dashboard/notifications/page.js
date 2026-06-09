'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, CheckCircle, AlertCircle, Package, ShoppingCart, Users, DollarSign, Trash2, Check, X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Pagination } from '@/components/ui/pagination'
import { DateRangeFilter, getDateRangeStart } from '@/components/ui/date-range-filter'

// Mobile Card Component for Notifications
function NotificationMobileCard({ notification, onMarkAsRead, onDelete, getNotificationIcon, getNotificationColor, formatDate }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)} flex-shrink-0`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-neutral-900 text-sm leading-tight">
                  {notification.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {formatDate(notification.created_at)}
                </p>
              </div>
            </div>
            {!notification.is_read && (
              <Badge variant="default" className="bg-emerald-600 text-xs flex-shrink-0">
                New
              </Badge>
            )}
          </div>

          <div className="bg-neutral-50 rounded-lg p-3">
            <p className="text-sm text-neutral-700 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 animate-slide-down border-t border-neutral-200">
              <div className="flex gap-2">
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="flex-1 hover:bg-emerald-50 border-2"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(notification.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
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
              <><ChevronDown className="h-4 w-4 mr-1" />View Actions</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  const { userProfile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
        toast.success('Marked as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to update notification')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })))
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to update notifications')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId))
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-5 w-5" />
      case 'payment':
        return <DollarSign className="h-5 w-5" />
      case 'inventory':
        return <Package className="h-5 w-5" />
      case 'staff':
        return <Users className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-600'
      case 'payment':
        return 'bg-success-100 text-success-600'
      case 'inventory':
        return 'bg-orange-100 text-orange-600'
      case 'staff':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-emerald-100 text-emerald-600'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  // Filter notifications based on search term
  const filteredNotifications = useMemo(() => {
    let result = notifications

    // Date range filter
    if (dateRange !== 'all') {
      const start = getDateRangeStart(dateRange)
      if (start) {
        result = result.filter(n => new Date(n.created_at) >= start)
      }
    }

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(notification =>
        notification.title?.toLowerCase().includes(lowerSearch) ||
        notification.message?.toLowerCase().includes(lowerSearch)
      )
    }

    return result
  }, [notifications, searchTerm, dateRange])

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / pageSize)
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredNotifications.slice(startIndex, startIndex + pageSize)
  }, [filteredNotifications, currentPage, pageSize])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Notifications</h1>
          <p className="text-neutral-600 mt-2 text-lg">
            Stay updated with your business activities
          </p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              variant="outline"
              className="border-2 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-neutral-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total</p>
                <p className="text-2xl font-bold text-neutral-900">{notifications.length}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Bell className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Read</p>
                <p className="text-2xl font-bold text-success-600">
                  {notifications.length - unreadCount}
                </p>
              </div>
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-neutral-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {notifications.filter(n => {
                    const notifDate = new Date(n.created_at)
                    const today = new Date()
                    return notifDate.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar — date + search */}
      <div className="flex flex-col gap-3">
        {/* Date range filter */}
        <DateRangeFilter value={dateRange} onChange={setDateRange} />

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search notifications by title or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-2"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="border-2 border-neutral-200 shadow-lg">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="text-2xl font-bold text-neutral-900">
            All Notifications ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-neutral-900">
                {searchTerm ? 'No matching notifications' : 'No notifications yet'}
              </p>
              <p className="text-neutral-600 mt-2">
                {searchTerm ? 'Try adjusting your search terms' : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block divide-y divide-neutral-200">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-5 hover:bg-emerald-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getNotificationColor(notification.type)} flex-shrink-0`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-neutral-900 text-base">
                              {notification.title}
                            </h3>
                            <p className="text-neutral-600 mt-1 text-sm">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-neutral-500">
                                {formatDate(notification.created_at)}
                              </span>
                              {!notification.is_read && (
                                <Badge variant="default" className="bg-emerald-600 text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="hover:bg-emerald-100"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-4">
                {paginatedNotifications.map((notification) => (
                  <NotificationMobileCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    getNotificationIcon={getNotificationIcon}
                    getNotificationColor={getNotificationColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-neutral-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredNotifications.length}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
