import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Public Order Tracking API
 * No authentication required - public endpoint for customers
 * 
 * GET /api/track/{orderIdOrReference}
 */
export async function GET(request, { params }) {
  try {
    const searchTerm = params.searchTerm
    
    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Order ID or delivery reference is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Search by order ID or delivery reference
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_status,
        delivery_status,
        delivery_reference,
        driver_name,
        vehicle_number,
        created_at,
        confirmed_at,
        packed_at,
        dispatched_at,
        delivered_at,
        retailer_id,
        retailers (
          shop_name
        )
      `)
      .or(`id.eq.${searchTerm},delivery_reference.eq.${searchTerm}`)
      .single()
    
    const { data: order, error } = await query
    
    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found. Please check your order ID or delivery reference.' },
        { status: 404 }
      )
    }

    // Return public-safe order information
    return NextResponse.json({
      id: order.id,
      order_status: order.order_status,
      delivery_status: order.delivery_status,
      delivery_reference: order.delivery_reference,
      driver_name: order.driver_name,
      vehicle_number: order.vehicle_number,
      created_at: order.created_at,
      confirmed_at: order.confirmed_at,
      packed_at: order.packed_at,
      dispatched_at: order.dispatched_at,
      delivered_at: order.delivered_at,
      retailer_name: order.retailers?.shop_name
    })
  } catch (error) {
    console.error('Tracking API error:', error)
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    )
  }
}
