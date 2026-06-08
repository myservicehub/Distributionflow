import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'

/**
 * GET /api/notifications
 * Get user notifications with pagination
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { page, pageSize, from, to } = getPaginationParams(request)

    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userContext.userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const response = buildPaginationResponse(notifications || [], count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }
}

/**
 * PUT /api/notifications
 * Mark notification as read (expects notification_id in body)
 */
export async function PUT(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const body = await request.json()
    const { notification_id } = body

    if (!notification_id) {
      return errorResponse('Notification ID is required', 400)
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notification_id)
      .eq('user_id', userContext.userId)
      .select()
      .single()

    if (error) throw error

    return successResponse({ success: true, data: notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return errorResponse('Failed to mark notification as read', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
