import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics (optimized for memory)
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  // Auth check
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Subscription check
  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) {
    return errorResponse(subscriptionError.message, 402)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  try {
    // OPTIMIZED: Only select needed columns and use database filtering
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

    // Get only top 10 overdue retailers
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

    // Get only top 10 low stock products
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .eq('business_id', userContext.businessId)
      .order('stock_quantity', { ascending: true })
      .limit(50)

    const lowStockProducts = (allProducts || [])
      .filter(p => (p.stock_quantity || 0) <= (p.low_stock_threshold || 10))
      .slice(0, 10)

    // Get sales by rep (today only)
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

    return successResponse({
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
    // Return empty data instead of failing
    return successResponse({
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

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
