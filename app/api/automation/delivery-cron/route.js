import { NextResponse } from 'next/server'
import { runDeliveryAutomation, checkDelayedDeliveries, autoCancelPendingOrders } from '@/lib/delivery-automation'

export const dynamic = 'force-dynamic'

/**
 * Delivery Automation Cron Endpoint
 * Can be called by external cron service (e.g., Vercel Cron, GitHub Actions)
 * Or manually triggered by admin
 * 
 * GET /api/automation/delivery-cron?task=all
 * GET /api/automation/delivery-cron?task=delays
 * GET /api/automation/delivery-cron?task=cancel
 */
export async function GET(request) {
  try {
    // Optional: Add authorization header check for external cron services
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key'
    
    // Allow requests with valid auth or from localhost (for dev/testing)
    const isAuthorized = authHeader === `Bearer ${cronSecret}` || 
                         request.headers.get('host')?.includes('localhost')
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const task = searchParams.get('task') || 'all'
    
    let results = {}
    
    switch (task) {
      case 'delays':
        results = {
          task: 'Delivery Delay Check',
          ...await checkDelayedDeliveries()
        }
        break
      
      case 'cancel':
        results = {
          task: 'Auto-Cancel Pending Orders',
          ...await autoCancelPendingOrders()
        }
        break
      
      case 'all':
      default:
        results = await runDeliveryAutomation()
        break
    }
    
    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Automation cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggers from admin dashboard
export async function POST(request) {
  return GET(request)
}
