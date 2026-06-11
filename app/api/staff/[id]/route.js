import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'

/**
 * PUT /api/staff/[id]
 * Update staff member
 */
export async function PUT(request, { params }) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Permission check
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can update staff', 403)
  }

  try {
    const body = await request.json()
    const userId = params.id

    // Can't change your own role
    if (userId === userContext.userId && body.role && body.role !== userContext.role) {
      return errorResponse('Cannot change your own role', 400)
    }

    // Use admin client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update user profile
    const updateData = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.role !== undefined) updateData.role = body.role
    if (body.status !== undefined) updateData.status = body.status
    if (body.phone !== undefined) updateData.phone = body.phone

    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update auth metadata if role changed
    if (body.role !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: body.role }
      })
    }

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.UPDATE,
      RESOURCE_TYPES.USER,
      user.id,
      { user_name: user.name, changes: updateData }
    )

    return successResponse({ success: true, data: user })
  } catch (error) {
    console.error('Error updating staff:', error)
    return errorResponse('Failed to update staff member', 500)
  }
}

/**
 * DELETE /api/staff/[id]
 * Deactivate staff member
 */
export async function DELETE(request, { params }) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Permission check
  if (userContext.role !== 'admin') {
    return errorResponse('Forbidden: Only admins can delete staff', 403)
  }

  try {
    const userId = params.id

    // Can't delete yourself
    if (userId === userContext.userId) {
      return errorResponse('Cannot delete your own account', 400)
    }

    // Use admin client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Soft delete (set status to inactive)
    const { data: user, error: deleteError } = await supabaseAdmin
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', userId)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (deleteError) throw deleteError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.DELETE,
      RESOURCE_TYPES.USER,
      user.id,
      { user_name: user.name }
    )

    return successResponse({ success: true, message: 'Staff member deactivated successfully' })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return errorResponse('Failed to delete staff member', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
