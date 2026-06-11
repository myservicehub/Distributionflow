import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, errorResponse, successResponse } from '@/lib/api/helpers'
import { createClient } from '@supabase/supabase-js'

// Create admin client for bypassing RLS when needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * GET /api/my-deliveries
 * Driver-scoped delivery list
 * Returns orders assigned to the authenticated driver
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Only drivers can access this endpoint
  if (userContext.role !== 'driver') {
    return errorResponse('Forbidden: Only drivers can access this endpoint', 403)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active' // 'active' or 'completed'

  try {
    // Find the driver record linked to this user
    const { data: driverRecord, error: driverError } = await adminSupabase
      .from('drivers')
      .select('id, name, vehicle_number, vehicle_type, phone, total_deliveries, successful_deliveries, failed_deliveries')
      .eq('business_id', userContext.businessId)
      .eq('user_id', userContext.userId)
      .maybeSingle()

    if (driverError) {
      console.error('Error fetching driver record:', driverError)
    }

    // Build query — match by driver_id (preferred) or driver_name (fallback)
    let query = adminSupabase
      .from('orders')
      .select(`
        id, 
        order_number,
        order_status, 
        delivery_status,
        total_amount, 
        created_at, 
        dispatched_at,
        delivered_at, 
        driver_name, 
        vehicle_number,
        delivery_notes,
        proof_of_delivery_url, 
        proof_of_delivery_note,
        proof_captured_at,
        retailers(
          id,
          shop_name, 
          owner_name, 
          phone, 
          address, 
          email,
          location_coordinates
        ),
        order_items(
          id,
          quantity, 
          unit_price, 
          total_price,
          products(
            id,
            name, 
            sku,
            unit
          )
        )
      `)
      .eq('business_id', userContext.businessId)
      .order('dispatched_at', { ascending: false, nullsFirst: false })

    if (driverRecord) {
      // Match by driver_id if linked
      query = query.eq('driver_id', driverRecord.id)
    } else {
      // Fallback: match by driver_name
      const { data: userProfile } = await adminSupabase
        .from('users')
        .select('name')
        .eq('id', userContext.userId)
        .single()
      
      if (userProfile?.name) {
        query = query.ilike('driver_name', userProfile.name)
      } else {
        // No driver record and no name - return empty
        return successResponse({
          orders: [],
          driver: null,
          message: 'No driver record found for this user'
        })
      }
    }

    // Filter by active vs completed
    if (status === 'active') {
      query = query.in('delivery_status', ['out_for_delivery', 'packed'])
    } else if (status === 'completed') {
      query = query.in('delivery_status', ['delivered', 'failed']).limit(50)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      throw ordersError
    }

    return successResponse({
      orders: orders || [],
      driver: driverRecord || null,
      count: orders?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/my-deliveries:', error)
    return errorResponse('Failed to load deliveries', 500)
  }
}
