import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'

export async function POST(request) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: userContext.userId,
      })
      .eq('business_id', userContext.businessId)
      .eq('is_read', false)

    if (error) throw error
    return successResponse({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return errorResponse('Failed to mark all notifications as read', 500)
  }
}

export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
