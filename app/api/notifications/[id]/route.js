import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'

export async function PUT(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Notification id is required', 400)

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: userContext.userId,
      })
      .eq('id', id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (error) throw error
    return successResponse({ success: true, data })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return errorResponse('Failed to mark notification as read', 500)
  }
}

export async function DELETE(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Notification id is required', 400)

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('business_id', userContext.businessId)

    if (error) throw error
    return successResponse({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return errorResponse('Failed to delete notification', 500)
  }
}

export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
