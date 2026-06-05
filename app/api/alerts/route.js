// Email Alerts Management API
// Trigger email alerts manually or via cron

import { NextResponse } from 'next/server'
import { sendDailySummary } from '@/lib/email-alerts'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

/**
 * GET /api/alerts?action=send-daily-summary&business_id=xxx
 * POST /api/alerts { action: 'send-daily-summary-all' }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const businessId = searchParams.get('business_id')

    if (action === 'send-daily-summary') {
      if (!businessId) {
        return handleCORS(NextResponse.json({ 
          error: 'business_id required' 
        }, { status: 400 }))
      }

      const result = await sendDailySummary(businessId)
      
      return handleCORS(NextResponse.json({
        success: result.success,
        sentTo: result.sentTo || 0,
        error: result.error || null
      }))
    }

    return handleCORS(NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 }))

  } catch (error) {
    console.error('Email alerts API error:', error)
    return handleCORS(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }))
  }
}

/**
 * POST endpoint for bulk operations (cron jobs)
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, cron_key } = body

    // Simple auth for cron jobs
    const validCronKey = process.env.CRON_SECRET_KEY || 'your-secure-cron-key'
    
    if (action === 'send-daily-summary-all') {
      // Verify cron key
      if (cron_key !== validCronKey) {
        return handleCORS(NextResponse.json({ 
          error: 'Unauthorized' 
        }, { status: 401 }))
      }

      const supabase = getAdminClient()
      
      // Get all businesses with email_alerts enabled
      const { data: businesses } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          subscription_status,
          plans (
            features
          )
        `)
        .in('subscription_status', ['active', 'trial'])
      
      const results = []
      
      for (const business of businesses) {
        const hasEmailAlerts = business.plans?.features?.email_alerts === true
        
        if (hasEmailAlerts) {
          const result = await sendDailySummary(business.id)
          results.push({
            businessId: business.id,
            businessName: business.name,
            success: result.success,
            sentTo: result.sentTo || 0
          })
        }
      }

      return handleCORS(NextResponse.json({
        success: true,
        processed: results.length,
        results
      }))
    }

    return handleCORS(NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 }))

  } catch (error) {
    console.error('Email alerts POST error:', error)
    return handleCORS(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }))
  }
}
