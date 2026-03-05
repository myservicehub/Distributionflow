// Platform Admin API Routes
// Server-side only - uses service role

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  isSuperAdmin,
  getSuperAdminProfile,
  getPlatformKPIs,
  getAllBusinesses,
  getBusinessDetail,
  suspendBusiness,
  reactivateBusiness,
  resetTrial,
  createImpersonationSession,
  endImpersonationSession,
  getAllSubscriptions,
  getRevenueAnalytics,
  getFeatureOverrides,
  setFeatureOverride,
  deleteFeatureOverride,
  getPlatformAuditLogs,
  logPlatformAction
} from '@/lib/platform-admin'

async function getSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

async function verifyAdmin() {
  const supabase = await getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  
  const isAdmin = await isSuperAdmin(user.id)
  if (!isAdmin) {
    return { error: 'Forbidden - Super admin access required', status: 403 }
  }
  
  const profile = await getSuperAdminProfile(user.id)
  return { admin: profile }
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const route = searchParams.get('route')
    
    // Verify admin
    const authResult = await verifyAdmin()
    if (authResult.error) {
      return handleCORS(NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      ))
    }
    
    const admin = authResult.admin
    
    // Get Platform KPIs
    if (route === 'kpis') {
      const kpis = await getPlatformKPIs()
      return handleCORS(NextResponse.json({ success: true, data: kpis }))
    }
    
    // Get All Businesses
    if (route === 'businesses') {
      const status = searchParams.get('status')
      const plan = searchParams.get('plan')
      const businessStatus = searchParams.get('businessStatus')
      
      const businesses = await getAllBusinesses({
        status,
        plan,
        businessStatus
      })
      
      return handleCORS(NextResponse.json({ success: true, data: businesses }))
    }
    
    // Get Business Detail
    if (route === 'business-detail') {
      const businessId = searchParams.get('id')
      if (!businessId) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID required' },
          { status: 400 }
        ))
      }
      
      const business = await getBusinessDetail(businessId)
      return handleCORS(NextResponse.json({ success: true, data: business }))
    }
    
    // Get All Subscriptions
    if (route === 'subscriptions') {
      const status = searchParams.get('status')
      const subscriptions = await getAllSubscriptions({ status })
      return handleCORS(NextResponse.json({ success: true, data: subscriptions }))
    }
    
    // Get Revenue Analytics
    if (route === 'revenue') {
      const analytics = await getRevenueAnalytics()
      return handleCORS(NextResponse.json({ success: true, data: analytics }))
    }
    
    // Get Feature Overrides
    if (route === 'feature-overrides') {
      const businessId = searchParams.get('businessId')
      if (!businessId) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID required' },
          { status: 400 }
        ))
      }
      
      const overrides = await getFeatureOverrides(businessId)
      return handleCORS(NextResponse.json({ success: true, data: overrides }))
    }
    
    // Get Audit Logs
    if (route === 'audit-logs') {
      const limit = parseInt(searchParams.get('limit') || '100')
      const action = searchParams.get('action')
      const targetType = searchParams.get('targetType')
      
      const logs = await getPlatformAuditLogs(limit, { action, targetType })
      return handleCORS(NextResponse.json({ success: true, data: logs }))
    }
    
    return handleCORS(NextResponse.json(
      { error: 'Invalid route' },
      { status: 400 }
    ))
    
  } catch (error) {
    console.error('Platform API error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message },
      { status: 500 }
    ))
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { route } = body
    
    // Verify admin
    const authResult = await verifyAdmin()
    if (authResult.error) {
      return handleCORS(NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      ))
    }
    
    const admin = authResult.admin
    
    // Suspend Business
    if (route === 'suspend-business') {
      const { businessId, reason } = body
      if (!businessId || !reason) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID and reason required' },
          { status: 400 }
        ))
      }
      
      await suspendBusiness(businessId, admin.id, reason)
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    // Reactivate Business
    if (route === 'reactivate-business') {
      const { businessId } = body
      if (!businessId) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID required' },
          { status: 400 }
        ))
      }
      
      await reactivateBusiness(businessId, admin.id)
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    // Reset Trial
    if (route === 'reset-trial') {
      const { businessId, days = 14 } = body
      if (!businessId) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID required' },
          { status: 400 }
        ))
      }
      
      await resetTrial(businessId, admin.id, days)
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    // Create Impersonation Session
    if (route === 'impersonate') {
      const { businessId } = body
      if (!businessId) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID required' },
          { status: 400 }
        ))
      }
      
      const session = await createImpersonationSession(admin.id, businessId)
      return handleCORS(NextResponse.json({ success: true, data: session }))
    }
    
    // End Impersonation Session
    if (route === 'end-impersonation') {
      const { token } = body
      if (!token) {
        return handleCORS(NextResponse.json(
          { error: 'Token required' },
          { status: 400 }
        ))
      }
      
      await endImpersonationSession(token)
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    // Set Feature Override
    if (route === 'set-feature-override') {
      const { businessId, featureName, enabled, reason } = body
      if (!businessId || !featureName || enabled === undefined) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID, feature name, and enabled status required' },
          { status: 400 }
        ))
      }
      
      await setFeatureOverride(businessId, featureName, enabled, reason, admin.id)
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    // Delete Feature Override
    if (route === 'delete-feature-override') {
      const { businessId, featureName } = body
      if (!businessId || !featureName) {
        return handleCORS(NextResponse.json(
          { error: 'Business ID and feature name required' },
          { status: 400 }
        ))
      }
      
      await deleteFeatureOverride(businessId, featureName, admin.id)
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    return handleCORS(NextResponse.json(
      { error: 'Invalid route' },
      { status: 400 }
    ))
    
  } catch (error) {
    console.error('Platform API error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message },
      { status: 500 }
    ))
  }
}
