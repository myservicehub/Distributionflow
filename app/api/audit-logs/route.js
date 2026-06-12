import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'

/**
 * GET /api/audit-logs
 * List audit logs with pagination
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Only admins and managers can view audit logs
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can view audit logs', 403)
  }

  try {
    const { page, pageSize, from, to } = getPaginationParams(request)
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')   // ISO date string from the page (Today / 7d / 30d / 90d)
    const toDate   = searchParams.get('to')     // optional upper bound

    let query = supabase
      .from('audit_logs')
      .select('*, users!audit_logs_user_id_fkey(name, email)', { count: 'exact' })
      .eq('business_id', userContext.businessId)

    if (fromDate) query = query.gte('created_at', fromDate)
    if (toDate)   query = query.lte('created_at', toDate)

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Format response
    const formattedLogs = (logs || []).map(log => ({
      ...log,
      user_name: log.users?.name || 'System',
      user_email: log.users?.email || null
    }))

    const response = buildPaginationResponse(formattedLogs, count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return errorResponse('Failed to fetch audit logs', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
