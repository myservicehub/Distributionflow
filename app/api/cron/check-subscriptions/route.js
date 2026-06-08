// Cron Job: Check and Expire Subscriptions
// Run daily to automatically expire trials and subscriptions

import { NextResponse } from 'next/server'
import { checkAndExpireTrials } from '@/lib/subscription'

// Mark this route as dynamic (not statically rendered)
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Enforce API key authentication - fail closed, not open
    const apiKey = request.headers.get('x-cron-api-key')
    const expectedKey = process.env.CRON_API_KEY
    
    // If CRON_API_KEY is not configured, reject request (fail closed)
    if (!expectedKey) {
      console.error('❌ CRON_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }
    
    // Verify API key matches
    if (apiKey !== expectedKey) {
      console.warn('⚠️ Unauthorized cron request attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Running subscription expiration check...')
    
    const result = await checkAndExpireTrials()
    
    console.log(`✅ Subscription check complete: ${result.expired} expired, ${result.errors} errors, ${result.total} total`)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
