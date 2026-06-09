'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NotificationBell() {
  const { userProfile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef(null)

  // Only show for admin, manager, and warehouse roles
  if (!userProfile || !['admin', 'manager', 'warehouse'].includes(userProfile.role)) {
    return null
  }

  useEffect(() => {
    if (!userProfile?.business_id) return

    // Load initial notifications
    loadNotifications()

    // Setup realtime subscription
    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userProfile?.business_id])

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('business_id', userProfile.business_id)
      
      // Warehouse users only see their notifications
      if (userProfile.role === 'warehouse') {
        query = query.contains('target_roles', ['warehouse'])
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      const unread = data?.filter(n => !n.is_read).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    // Create channel
    const channel = supabase.channel(`notifications-${userProfile.business_id}`)
    
    // Store reference for cleanup
    channelRef.current = channel

    // Add INSERT listener
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `business_id=eq.${userProfile.business_id}`
      },
      handleNewNotification
    )
    
    // Add UPDATE listener
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `business_id=eq.${userProfile.business_id}`
      },
      handleUpdatedNotification
    )
    
    // Subscribe to channel
    channel.subscribe((status) => {
      // Subscription active
    })
  }

  const handleNewNotification = (payload) => {
    const newNotification = payload.new
    
    // Check if notification is for this user's role
    const isForThisRole = newNotification.target_roles && 
      (newNotification.target_roles.includes(userProfile.role) ||
       userProfile.role === 'admin' || 
       userProfile.role === 'manager')
    
    if (isForThisRole) {
      // Add to notifications list
      setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
      setUnreadCount(prev => prev + 1)
      
      // Show toast notification
      toast(newNotification.title, {
        description: newNotification.message,
        duration: 5000
      })
    }
  }

  const handleUpdatedNotification = (payload) => {
    setNotifications(prev =>
      prev.map(n => n.id === payload.new.id ? payload.new : n)
    )
    
    if (payload.new.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: userProfile.id
        })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: userProfile.id
        })
        .eq('business_id', userProfile.business_id)
        .eq('is_read', false)

      if (error) throw error

      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'critical':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-3 cursor-pointer ${
                !notification.is_read ? 'bg-muted/50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)}`} />
                  <span className="font-semibold text-sm">
                    {notification.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.created_at)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                {notification.message}
              </p>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="w-full text-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
