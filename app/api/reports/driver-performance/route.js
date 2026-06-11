import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, errorResponse, successResponse } from '@/lib/api/helpers'

/**
 * GET /api/reports/driver-performance
 * Driver performance and delivery statistics report
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const range = searchParams.get('range') || '30d'

    // Get all drivers with their stats
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select(`
        id,
        name,
        phone,
        vehicle_number,
        vehicle_type,
        total_deliveries,
        successful_deliveries,
        failed_deliveries,
        created_at,
        status
      `)
      .eq('business_id', userContext.businessId)
      .order('total_deliveries', { ascending: false })

    if (driversError) throw driversError

    // For each driver, get their recent deliveries with time metrics
    const driverPerformance = await Promise.all(
      (drivers || []).map(async (driver) => {
        // Get recent deliveries
        let query = supabase
          .from('orders')
          .select(`
            id,
            order_number,
            created_at,
            dispatched_at,
            delivered_at,
            delivery_status,
            total_amount,
            retailers(shop_name)
          `)
          .eq('business_id', userContext.businessId)
          .eq('driver_id', driver.id)
          .in('delivery_status', ['delivered', 'failed'])

        // Apply date filter if provided
        if (from) {
          query = query.gte('delivered_at', from)
        }

        const { data: recentDeliveries } = await query.limit(100)

        // Calculate metrics
        const deliveriesInRange = recentDeliveries || []
        const successfulInRange = deliveriesInRange.filter(d => d.delivery_status === 'delivered').length
        const failedInRange = deliveriesInRange.filter(d => d.delivery_status === 'failed').length
        
        // Calculate average delivery time (from dispatch to delivery)
        const deliveryTimes = deliveriesInRange
          .filter(d => d.dispatched_at && d.delivered_at && d.delivery_status === 'delivered')
          .map(d => {
            const dispatchTime = new Date(d.dispatched_at)
            const deliveryTime = new Date(d.delivered_at)
            return (deliveryTime - dispatchTime) / (1000 * 60 * 60) // hours
          })

        const avgDeliveryTime = deliveryTimes.length > 0
          ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
          : 0

        // Calculate total revenue from successful deliveries
        const totalRevenue = deliveriesInRange
          .filter(d => d.delivery_status === 'delivered')
          .reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0)

        // Success rate
        const successRate = driver.total_deliveries > 0
          ? (driver.successful_deliveries / driver.total_deliveries) * 100
          : 0

        return {
          ...driver,
          deliveries_in_range: deliveriesInRange.length,
          successful_in_range: successfulInRange,
          failed_in_range: failedInRange,
          avg_delivery_time_hours: Math.round(avgDeliveryTime * 10) / 10,
          total_revenue: totalRevenue,
          success_rate: Math.round(successRate * 10) / 10,
          recent_deliveries: deliveriesInRange.slice(0, 5) // Last 5 for details
        }
      })
    )

    // Sort by deliveries in selected range
    driverPerformance.sort((a, b) => b.deliveries_in_range - a.deliveries_in_range)

    // Calculate overall statistics
    const totalDrivers = drivers?.length || 0
    const activeDrivers = driverPerformance.filter(d => d.status === 'active').length
    const totalDeliveriesAllTime = driverPerformance.reduce((sum, d) => sum + (d.total_deliveries || 0), 0)
    const totalDeliveriesInRange = driverPerformance.reduce((sum, d) => sum + (d.deliveries_in_range || 0), 0)
    const totalSuccessInRange = driverPerformance.reduce((sum, d) => sum + (d.successful_in_range || 0), 0)
    const totalFailedInRange = driverPerformance.reduce((sum, d) => sum + (d.failed_in_range || 0), 0)
    const overallSuccessRate = totalDeliveriesInRange > 0
      ? (totalSuccessInRange / totalDeliveriesInRange) * 100
      : 0

    return successResponse({
      drivers: driverPerformance,
      summary: {
        total_drivers: totalDrivers,
        active_drivers: activeDrivers,
        total_deliveries_all_time: totalDeliveriesAllTime,
        total_deliveries_in_range: totalDeliveriesInRange,
        successful_deliveries: totalSuccessInRange,
        failed_deliveries: totalFailedInRange,
        overall_success_rate: Math.round(overallSuccessRate * 10) / 10
      },
      date_range: range
    })

  } catch (error) {
    console.error('Error fetching driver performance:', error)
    return errorResponse('Failed to fetch driver performance report', 500)
  }
}
