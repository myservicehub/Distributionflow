// Cron Job: Check and Expire Subscriptions
// Run daily to automatically expire trials and subscriptions

import { NextResponse } from 'next/server'
import { checkAndExpireTrials } from '@/lib/subscription'

export async function GET(request) {
  try {
    // Optional: Add API key authentication for security
    const apiKey = request.headers.get('x-cron-api-key')
    const expectedKey = process.env.CRON_API_KEY
    
    // If CRON_API_KEY is set in env, enforce authentication
    if (expectedKey && apiKey !== expectedKey) {
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
