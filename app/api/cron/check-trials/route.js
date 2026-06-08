// Cron Job: Check and Expire Trials
// Should be called daily via external cron service
// Example: curl -X POST https://your-domain.com/api/cron/check-trials -H "x-cron-api-key: YOUR_CRON_API_KEY"

import { NextResponse } from 'next/server'
import { checkAndExpireTrials } from '@/lib/subscription'

export async function POST(request) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Running trial expiry check...')
    const result = await checkAndExpireTrials()

    console.log(`Trial check complete: ${result.expired} expired, ${result.errors} errors, ${result.total} checked`)

    return NextResponse.json({
      success: true,
      message: 'Trial check completed',
      ...result
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  // Support GET for convenience, but use same auth
  return POST(request)
}
