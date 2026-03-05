// Cron Job: Check and Expire Trials
// Should be called daily via external cron service
// Example: curl -X POST https://your-domain.com/api/cron/check-trials -H "Authorization: Bearer YOUR_CRON_SECRET"

import { NextResponse } from 'next/server'
import { checkAndExpireTrials } from '@/lib/subscription'

const CRON_SECRET = process.env.CRON_SECRET || 'change-this-secret-in-production'

export async function POST(request) {
  try {
    // Verify authorization (simple secret-based auth for cron)
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    if (providedSecret !== CRON_SECRET) {
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
  // Allow GET for testing (remove in production or add better auth)
  return POST(request)
}
