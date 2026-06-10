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
 * GET /api/reports/debt-aging
 * Debt aging report
 */
export async function GET(request) {
  const supabase = await createClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('retailers')
      .select(`
        shop_name,
        current_balance,
        credit_limit,
        created_at,
        payments (
          created_at
        )
      `)
      .eq('business_id', userContext.businessId)
      .gt('current_balance', 0)
      .order('current_balance', { ascending: false })

    if (error) throw error

    // Calculate aging based on last payment date
    const now = new Date()
    const aging = data?.map(retailer => {
      const payments = retailer.payments || []
      const lastPaymentDate = payments.length > 0
        ? new Date(Math.max(...payments.map(p => new Date(p.created_at))))
        : null

      const referenceDate = lastPaymentDate || new Date(retailer.created_at)
      const daysOutstanding = Math.floor(
        (now - referenceDate) / (1000 * 60 * 60 * 24)
      )

      let agingCategory = '0-30 days'
      if (daysOutstanding > 90) agingCategory = '90+ days'
      else if (daysOutstanding > 60) agingCategory = '60-90 days'
      else if (daysOutstanding > 30) agingCategory = '30-60 days'

      return {
        shop_name: retailer.shop_name,
        current_balance: retailer.current_balance,
        credit_limit: retailer.credit_limit,
        aging_category: agingCategory,
        days_outstanding: daysOutstanding,
        last_payment_date: lastPaymentDate?.toISOString() || null,
        never_paid: !lastPaymentDate
      }
    })

    return NextResponse.json(aging || [])
  } catch (error) {
    console.error('Error fetching debt aging report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
