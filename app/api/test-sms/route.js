import { NextResponse } from 'next/server'
import { sendDriverDispatchSMS, formatNigerianPhone } from '@/lib/sms-notifications'

/**
 * Test endpoint for Termii SMS integration
 * GET /api/test-sms?phone=08012345678
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required. Usage: /api/test-sms?phone=08012345678' },
        { status: 400 }
      )
    }

    // Format phone number to E.164
    const formattedPhone = formatNigerianPhone(phone)

    // Send test SMS
    const result = await sendDriverDispatchSMS({
      to: formattedPhone,
      driverName: 'Test Driver',
      orderReference: 'ORD-TEST-001',
      retailerName: 'Test Retailer',
      deliveryAddress: '123 Test Street, Lagos'
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully via Termii',
        phone: formattedPhone,
        messageId: result.messageId,
        status: result.status
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send SMS',
        error: result.error,
        mock: result.mock || false,
        phone: formattedPhone
      }, { status: result.mock ? 200 : 500 })
    }

  } catch (error) {
    console.error('Test SMS error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
