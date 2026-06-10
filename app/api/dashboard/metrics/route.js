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
 * GET /api/dashboard/metrics
 * Dashboard overview metrics
 */
export async function GET(request) {
  const supabase = await createClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  try {
    // Get total sales today
    const { data: salesToday } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('business_id', userContext.businessId)
      .gte('created_at', today.toISOString())
      .in('order_status', ['confirmed', 'completed'])

    const totalSalesToday = salesToday?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0

    // Get total sales this month
    const { data: salesMonth } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('business_id', userContext.businessId)
      .gte('created_at', startOfMonth.toISOString())
      .in('order_status', ['confirmed', 'completed'])

    const totalSalesMonth = salesMonth?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0

    // Get total debt
    const { data: retailers } = await supabase
      .from('retailers')
      .select('current_balance')
      .eq('business_id', userContext.businessId)
      .eq('status', 'active')

    const totalDebt = retailers?.reduce((sum, retailer) => sum + parseFloat(retailer.current_balance || 0), 0) || 0

    // Get top 10 overdue retailers
    const { data: overdueRetailers } = await supabase
      .from('retailers')
      .select('id, shop_name, owner_name, current_balance, credit_limit')
      .eq('business_id', userContext.businessId)
      .eq('status', 'active')
      .order('current_balance', { ascending: false })
      .limit(100)

    const topOverdueRetailers = (overdueRetailers || [])
      .filter(r => parseFloat(r.current_balance || 0) > parseFloat(r.credit_limit || 0))
      .slice(0, 10)

    // Get top 10 low stock products
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .eq('business_id', userContext.businessId)
      .order('stock_quantity', { ascending: true })
      .limit(50)

    const lowStockProducts = (allProducts || [])
      .filter(p => (p.stock_quantity || 0) <= (p.low_stock_threshold || 10))
      .slice(0, 10)

    // Get sales by rep
    const { data: salesByRep } = await supabase
      .from('orders')
      .select('sales_rep_id, total_amount, users!orders_sales_rep_id_fkey(name)')
      .eq('business_id', userContext.businessId)
      .gte('created_at', today.toISOString())
      .in('order_status', ['confirmed', 'completed'])

    const repSales = {}
    salesByRep?.forEach(order => {
      const repName = order.users?.name || 'Unknown'
      repSales[repName] = (repSales[repName] || 0) + parseFloat(order.total_amount || 0)
    })

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, details, created_at, users!audit_logs_user_id_fkey(name)')
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      totalSalesToday,
      totalSalesMonth,
      totalDebt,
      overdueRetailers: topOverdueRetailers,
      lowStockProducts,
      salesByRep: Object.entries(repSales).map(([name, total]) => ({ name, total })),
      recentActivity: recentActivity || []
    })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json({
      totalSalesToday: 0,
      totalSalesMonth: 0,
      totalDebt: 0,
      overdueRetailers: [],
      lowStockProducts: [],
      salesByRep: [],
      recentActivity: []
    })
  }
}
