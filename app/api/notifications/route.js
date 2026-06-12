import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'

export async function GET(request) {
  const supabase = createSupabaseClient()

  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate   = searchParams.get('to')
    const limit    = Math.min(500, parseInt(searchParams.get('limit') || '100', 10))

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('business_id', userContext.businessId)
      .or(`target_role.eq.all,target_role.eq.${userContext.role},target_roles.cs.{${userContext.role}}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fromDate) query = query.gte('created_at', fromDate)
    if (toDate)   query = query.lte('created_at', toDate)

    const { data, error } = await query
    if (error) throw error

    return successResponse(data || [])
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }
}

export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
