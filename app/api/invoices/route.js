// Invoice API Endpoint
// Generate, view, and download invoices

import { NextResponse } from 'next/server'
import { generateInvoice, generateAndSendInvoice } from '@/lib/invoice-generator'
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
 * GET /api/invoices?order_id=xxx&action=download
 * GET /api/invoices?order_id=xxx&action=view
 * GET /api/invoices?order_id=xxx&action=send
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const action = searchParams.get('action') || 'view'

    if (!orderId) {
      return handleCORS(NextResponse.json({ 
        error: 'order_id required' 
      }, { status: 400 }))
    }

    // Generate invoice
    const result = await generateInvoice(orderId)

    if (!result.success) {
      return handleCORS(NextResponse.json({ 
        error: result.error 
      }, { status: 500 }))
    }

    // Handle different actions
    if (action === 'download') {
      // Download PDF
      const response = new NextResponse(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${result.invoiceNumber}.pdf"`
        }
      })
      return handleCORS(response)
    }

    if (action === 'view') {
      // View PDF in browser
      const response = new NextResponse(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="invoice-${result.invoiceNumber}.pdf"`
        }
      })
      return handleCORS(response)
    }

    if (action === 'send') {
      // Generate and send via email
      const sendResult = await generateAndSendInvoice(orderId)
      
      return handleCORS(NextResponse.json({
        success: sendResult.success,
        invoiceNumber: sendResult.invoiceNumber,
        emailSent: sendResult.emailSent,
        error: sendResult.error
      }))
    }

    // Default: return metadata
    return handleCORS(NextResponse.json({
      success: true,
      invoiceNumber: result.invoiceNumber,
      invoiceData: result.invoiceData
    }))

  } catch (error) {
    console.error('Invoice API error:', error)
    return handleCORS(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }))
  }
}

/**
 * POST /api/invoices
 * Body: { order_id, action: 'generate' | 'send' }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { order_id, action } = body

    if (!order_id) {
      return handleCORS(NextResponse.json({ 
        error: 'order_id required' 
      }, { status: 400 }))
    }

    if (action === 'send') {
      // Generate and send invoice
      const result = await generateAndSendInvoice(order_id)
      
      return handleCORS(NextResponse.json({
        success: result.success,
        invoiceNumber: result.invoiceNumber,
        emailSent: result.emailSent,
        message: result.success 
          ? `Invoice ${result.invoiceNumber} generated and ${result.emailSent ? 'emailed' : 'created'}` 
          : result.error
      }))
    }

    // Default: just generate
    const result = await generateInvoice(order_id)
    
    return handleCORS(NextResponse.json({
      success: result.success,
      invoiceNumber: result.invoiceNumber,
      error: result.error
    }))

  } catch (error) {
    console.error('Invoice POST error:', error)
    return handleCORS(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }))
  }
}
