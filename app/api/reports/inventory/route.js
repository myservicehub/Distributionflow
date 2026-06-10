import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get current user's business ID
async function getUserBusinessId(supabase) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userProfile } = await supabase
      .from('users')
      .select('id, role, business_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) return null

    return {
      userId: userProfile.id,
      businessId: userProfile.business_id,
      role: userProfile.role,
      status: userProfile.status
    }
  } catch (error) {
    console.error('Error getting user business ID:', error)
    return null
  }
}

/**
 * GET /api/reports/inventory
 * Inventory report
 */
export async function GET(request) {
  const supabase = await createClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', userContext.businessId)
      .order('stock_quantity')

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching inventory report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
