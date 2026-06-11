import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, errorResponse, successResponse } from '@/lib/api/helpers'
import { createClient } from '@supabase/supabase-js'

// Create admin client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * POST /api/my-deliveries/upload-proof
 * Upload proof of delivery photo to Supabase Storage
 */
export async function POST(request) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Only drivers can access this endpoint
  if (userContext.role !== 'driver') {
    return errorResponse('Forbidden: Only drivers can access this endpoint', 403)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('photo')
    const orderId = formData.get('orderId')

    if (!file) {
      return errorResponse('Photo file is required', 400)
    }

    if (!orderId) {
      return errorResponse('Order ID is required', 400)
    }

    // Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
      return errorResponse('Only image files are allowed', 400)
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('Photo must be under 5MB', 400)
    }

    // Verify order belongs to this business and driver
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, driver_id, drivers(user_id)')
      .eq('id', orderId)
      .eq('business_id', userContext.businessId)
      .single()

    if (orderError || !order) {
      return errorResponse('Order not found or not accessible', 404)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Determine file extension
    const ext = file.type === 'image/png' ? 'png' : 
                file.type === 'image/jpeg' ? 'jpg' : 
                file.type === 'image/jpg' ? 'jpg' : 
                file.type === 'image/webp' ? 'webp' : 'jpg'
    
    // Create unique filename with business/order path
    const timestamp = Date.now()
    const fileName = `${userContext.businessId}/${orderId}/${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('proof-of-delivery')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }

    // Get public URL (signed URL valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from('proof-of-delivery')
      .createSignedUrl(fileName, 365 * 24 * 60 * 60) // 1 year

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      throw signedUrlError
    }

    return successResponse({
      success: true,
      url: signedUrlData.signedUrl,
      path: fileName,
      message: 'Photo uploaded successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/my-deliveries/upload-proof:', error)
    return errorResponse('Failed to upload photo', 500)
  }
}
