// Invoice Generation Service
// Generates PDF invoices for confirmed orders

import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
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

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 20
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280'
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'right'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  addressBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 10
  },
  text: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 4
  },
  boldText: {
    fontWeight: 'bold',
    color: '#111827'
  },
  table: {
    marginTop: 20,
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 10,
    fontSize: 10
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 10,
    backgroundColor: '#f9fafb',
    fontSize: 10
  },
  col1: { width: '10%' },
  col2: { width: '40%' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottom: '1px solid #e5e7eb'
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center'
  },
  paymentTerms: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderLeft: '3px solid #f59e0b',
    fontSize: 9
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    color: '#6b7280'
  }
})

// Invoice PDF Component
function InvoicePDF({ invoiceData }) {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    business,
    retailer,
    order,
    items,
    totals,
    paymentTerms
  } = invoiceData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>INVOICE</Text>
              <Text style={styles.subtitle}>{business.name}</Text>
            </View>
            <View>
              <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
              <Text style={styles.text}>Date: {invoiceDate}</Text>
              <Text style={styles.text}>Due: {dueDate}</Text>
            </View>
          </View>
        </View>

        {/* From & To Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View style={{ width: '48%' }}>
            <Text style={styles.sectionTitle}>From</Text>
            <View style={styles.addressBox}>
              <Text style={[styles.text, styles.boldText]}>{business.name}</Text>
              <Text style={styles.text}>{business.address}</Text>
              <Text style={styles.text}>Phone: {business.phone || 'N/A'}</Text>
              <Text style={styles.text}>Email: {business.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={{ width: '48%' }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <View style={styles.addressBox}>
              <Text style={[styles.text, styles.boldText]}>{retailer.shop_name}</Text>
              <Text style={styles.text}>Owner: {retailer.owner_name}</Text>
              <Text style={styles.text}>{retailer.address}</Text>
              <Text style={styles.text}>Phone: {retailer.phone}</Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Text style={styles.text}>Order ID: #{order.id.substring(0, 8)}</Text>
          <Text style={styles.text}>Payment Method: {order.payment_status}</Text>
          <Text style={styles.text}>Delivery Status: {order.delivery_status}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Product</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Qty</Text>
            <Text style={styles.col5}>Total</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.product_name}</Text>
              <Text style={styles.col3}>₦{parseFloat(item.unit_price).toLocaleString()}</Text>
              <Text style={styles.col4}>{item.quantity}</Text>
              <Text style={styles.col5}>₦{parseFloat(item.total_price).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>₦{totals.subtotal.toLocaleString()}</Text>
          </View>
          
          {totals.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-₦{totals.discount.toLocaleString()}</Text>
            </View>
          )}
          
          {totals.tax > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax (7.5%):</Text>
              <Text>₦{totals.tax.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text>GRAND TOTAL:</Text>
            <Text>₦{totals.grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Terms */}
        <View style={styles.paymentTerms}>
          <Text style={styles.boldText}>Payment Terms:</Text>
          <Text style={{ marginTop: 4 }}>{paymentTerms}</Text>
        </View>

        {/* Notes */}
        <View style={styles.notes}>
          <Text style={styles.boldText}>Notes:</Text>
          <Text style={{ marginTop: 4 }}>
            Thank you for your business! For any queries regarding this invoice, 
            please contact us at {business.email || 'your email'}.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by DistributionFlow - {new Date().toLocaleDateString()}</Text>
          <Text>This is a computer-generated invoice and requires no signature</Text>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(orderId) {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const orderPrefix = orderId.substring(0, 6).toUpperCase()
  return `INV-${year}${month}-${orderPrefix}`
}

/**
 * Calculate payment due date
 */
function calculateDueDate(paymentStatus, daysCredit = 30) {
  const dueDate = new Date()
  
  if (paymentStatus === 'credit') {
    dueDate.setDate(dueDate.getDate() + daysCredit)
  } else {
    dueDate.setDate(dueDate.getDate() + 7) // 7 days for others
  }
  
  return dueDate.toISOString().split('T')[0]
}

/**
 * Get payment terms text
 */
function getPaymentTerms(paymentStatus) {
  switch (paymentStatus) {
    case 'paid':
      return 'This invoice has been paid in full.'
    case 'credit':
      return 'Payment is due within 30 days from the invoice date. Late payments may incur additional charges.'
    case 'partial':
      return 'Partial payment received. Remaining balance due within 30 days.'
    default:
      return 'Payment is due within 7 days from the invoice date.'
  }
}

/**
 * Generate invoice for an order
 */
export async function generateInvoice(orderId) {
  try {
    const supabase = getAdminClient()

    // Fetch order with all details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        retailers (
          shop_name,
          owner_name,
          address,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Order not found')

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          name,
          sku
        )
      `)
      .eq('order_id', orderId)

    if (itemsError) throw itemsError

    // Fetch business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, address')
      .eq('id', order.business_id)
      .single()

    if (businessError) throw businessError

    // Format items
    const formattedItems = items.map(item => ({
      id: item.id,
      product_name: item.products?.name || 'Unknown Product',
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.total_price
    }))

    // Calculate totals
    const subtotal = parseFloat(order.total_amount)
    const discount = 0 // Add discount logic if needed
    const tax = 0 // Add tax logic if needed
    const grandTotal = subtotal - discount + tax

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(order.id),
      invoiceDate: new Date(order.created_at).toISOString().split('T')[0],
      dueDate: calculateDueDate(order.payment_status),
      business: {
        name: business.name,
        address: business.address || 'N/A',
        phone: '',
        email: ''
      },
      retailer: order.retailers,
      order: {
        id: order.id,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status
      },
      items: formattedItems,
      totals: {
        subtotal,
        discount,
        tax,
        grandTotal
      },
      paymentTerms: getPaymentTerms(order.payment_status)
    }

    // Generate PDF
    const pdfDoc = <InvoicePDF invoiceData={invoiceData} />
    const pdfBlob = await pdf(pdfDoc).toBlob()
    
    // Convert blob to buffer
    const buffer = await pdfBlob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return {
      success: true,
      invoiceNumber: invoiceData.invoiceNumber,
      pdfBase64: base64,
      buffer: Buffer.from(buffer),
      invoiceData
    }

  } catch (error) {
    console.error('Error generating invoice:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send invoice via email to retailer
 */
export async function emailInvoice(orderId, retailerEmail, invoiceBuffer, invoiceNumber) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DistributionFlow <invoices@distributionflow.com>',
      to: [retailerEmail],
      subject: `Invoice ${invoiceNumber} - Payment Due`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📄 Invoice Attached</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #6b7280;">
              Please find attached your invoice <strong>${invoiceNumber}</strong> for your recent order.
            </p>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                <strong>Status:</strong> Payment Pending
              </p>
            </div>
            
            <p style="color: #6b7280;">
              If you have any questions about this invoice, please don't hesitate to contact us.
            </p>
            
            <p style="color: #6b7280; margin-top: 30px;">
              Thank you for your business!<br>
              <strong>DistributionFlow Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>DistributionFlow - Invoice Management System</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: invoiceBuffer
        }
      ]
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Email invoice error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate and send invoice when order is confirmed
 */
export async function generateAndSendInvoice(orderId) {
  try {
    const supabase = getAdminClient()

    // Get retailer email
    const { data: order } = await supabase
      .from('orders')
      .select(`
        id,
        retailers (
          shop_name,
          owner_email,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (!order) throw new Error('Order not found')

    // Generate invoice
    const invoiceResult = await generateInvoice(orderId)
    
    if (!invoiceResult.success) {
      throw new Error(invoiceResult.error)
    }

    // Send email with invoice
    const retailerEmail = order.retailers?.owner_email
    
    if (retailerEmail) {
      await emailInvoice(
        orderId,
        retailerEmail,
        invoiceResult.buffer,
        invoiceResult.invoiceNumber
      )
    }

    // Store invoice metadata in database
    await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        invoice_number: invoiceResult.invoiceNumber,
        invoice_date: new Date().toISOString(),
        total_amount: invoiceResult.invoiceData.totals.grandTotal,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    return {
      success: true,
      invoiceNumber: invoiceResult.invoiceNumber,
      emailSent: !!retailerEmail
    }

  } catch (error) {
    console.error('Generate and send invoice error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
