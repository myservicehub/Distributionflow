import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription, enforceUserLimit } from '@/lib/api/subscription'
import { CreateStaffSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendStaffInvitation } from '@/lib/email'

/**
 * GET /api/staff
 * List all staff members
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    // Use admin client to bypass RLS for fetching staff
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

    const { data: staff, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, phone, status, created_at')
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return successResponse({ data: staff || [] })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return errorResponse('Failed to fetch staff', 500)
  }
}

/**
 * POST /api/staff
 * Create a new staff member
 */
export async function POST(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Subscription check
  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) {
    return errorResponse(subscriptionError.message, 402)
  }

  // Permission check
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can create staff', 403)
  }

  // User limit check
  const userLimitError = await enforceUserLimit(userContext.businessId)
  if (userLimitError) {
    return errorResponse(userLimitError.message, 402)
  }

  try {
    const body = await request.json()
    const { error: validationError, data: validatedData } = parseBody(CreateStaffSchema, body)
    
    if (validationError) {
      return validationError
    }

    // Use admin client for staff operations
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

    // DUPLICATE CHECK: Check if email already exists (across all businesses)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', validatedData.email)
      .maybeSingle()

    if (existingUser) {
      return errorResponse(
        'A user with this email already exists.',
        409,
        {
          error: 'Duplicate email',
          code: 'DUPLICATE_ENTRY',
          field: 'email'
        }
      )
    }

    // Generate temporary password
    const tempPassword = randomBytes(8).toString('hex')

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: validatedData.name,
        role: validatedData.role,
        needs_password_change: true  // Force password change on first login
      }
    })

    if (authError) throw authError

    // Create user profile
    const { data: user, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authUser.user.id,
        auth_user_id: authUser.user.id,  // Add auth_user_id
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        phone: validatedData.phone || null,
        business_id: userContext.businessId,
        status: 'active'
      }])
      .select()
      .single()

    if (profileError) throw profileError

    // Send invitation email
    try {
      await sendStaffInvitation(
        validatedData.email,
        validatedData.name,
        tempPassword,
        userContext.businessId
      )
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email fails
    }

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.CREATE,
      RESOURCE_TYPES.USER,
      user.id,
      { user_name: user.name, role: user.role }
    )

    return successResponse({ 
      success: true, 
      data: user,
      temporary_password: tempPassword 
    }, 201)
  } catch (error) {
    console.error('Error creating staff:', error)
    return errorResponse('Failed to create staff member', 500)
  }
}

/**
 * PUT /api/staff
 * Update staff member (expects user_id in body)
 */
export async function PUT(request) {
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
    const { user_id, ...updateData } = body

    if (!user_id) {
      return errorResponse('User ID is required', 400)
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

    // Update user
    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError

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
 * DELETE /api/staff
 * Deactivate staff member (expects user_id in query params)
 */
export async function DELETE(request) {
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
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return errorResponse('User ID is required', 400)
    }

    // Can't delete yourself
    if (user_id === userContext.userId) {
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
      .eq('id', user_id)
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
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
