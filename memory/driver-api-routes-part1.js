// =====================================================
// DRIVER API ROUTES
// Add these to app/api/[[...path]]/route.js
// OR create as app/api/my-deliveries/route.js
// =====================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/notifications'

// Create admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// =====================================================
// GET /api/my-deliveries
// Driver-scoped delivery list
// =====================================================
export async function GET(request) {
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (userContext.role !== 'driver') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'active'

  try {
    // Find the driver record linked to this user
    const { data: driverRecord } = await adminSupabase
      .from('drivers')
      .select('id, name, vehicle_number, vehicle_type, phone, total_deliveries, successful_deliveries, failed_deliveries')
      .eq('business_id', userContext.businessId)
      .eq('user_id', userContext.userId)
      .maybeSingle()

    // Build query — match by driver_id (preferred) or driver_name (fallback)
    let query = adminSupabase
      .from('orders')
      .select(`
        id, order_status, delivery_status,
        total_amount, created_at, dispatched_at,
        delivered_at, driver_name, vehicle_number,
        proof_of_delivery_url, proof_of_delivery_note,
        proof_captured_at,
        retailers(shop_name, owner_name, phone, address, email),
        order_items(
          quantity, unit_price, total_price,
          products(name, sku)
        )
      `)
      .eq('business_id', userContext.businessId)
      .order('dispatched_at', { ascending: false })

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
      query = query.ilike('driver_name', userProfile?.name || '')
    }

    // Filter by active vs completed
    if (status === 'active') {
      query = query.in('delivery_status', ['out_for_delivery', 'packed'])
    } else if (status === 'completed') {
      query = query.in('delivery_status', ['delivered', 'failed']).limit(30)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({
      orders: data || [],
      driver: driverRecord || null
    })
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json({ error: 'Failed to load deliveries' }, { status: 500 })
  }
}

// =====================================================
// POST /api/my-deliveries/upload-proof
// Upload proof of delivery photo
// =====================================================
export async function uploadProof(request, userContext) {
  if (!userContext || userContext.role !== 'driver') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('photo')
    const orderId = formData.get('orderId')

    if (!file || !orderId) {
      return NextResponse.json({ error: 'photo and orderId are required' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photo must be under 5MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const fileName = `${userContext.businessId}/${orderId}/${Date.now()}.${ext}`

    const { data, error } = await adminSupabase.storage
      .from('proof-of-delivery')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) throw error

    // Get signed URL valid for 1 year
    const { data: signedUrl } = await adminSupabase.storage
      .from('proof-of-delivery')
      .createSignedUrl(fileName, 365 * 24 * 60 * 60)

    return NextResponse.json({
      url: signedUrl.signedUrl,
      path: fileName
    })
  } catch (err) {
    console.error('Photo upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
