'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Send, MessageCircle, Link as LinkIcon, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * InvoiceActions Component
 * Provides one-click sharing buttons for invoices
 * 
 * @param {string} orderId - The order UUID
 * @param {object} retailer - Retailer information { shop_name, owner_email, phone }
 * @param {boolean} compact - Use compact layout (optional)
 */
export function InvoiceActions({ orderId, retailer, compact = false }) {
  const [shareInfo, setShareInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailSending, setEmailSending] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchShareInfo()
    }
  }, [orderId])

  const fetchShareInfo = async () => {
    try {
      const response = await fetch(`/api/invoices?order_id=${orderId}&action=share-info`)
      if (response.ok) {
        const data = await response.json()
        setShareInfo(data)
      }
    } catch (error) {
      console.error('Error fetching share info:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = () => {
    window.open(`/api/invoices?order_id=${orderId}&action=download`, '_blank')
    toast.success('📥 Invoice download started')
  }

  const shareViaWhatsApp = () => {
    if (shareInfo?.whatsappUrl) {
      window.open(shareInfo.whatsappUrl, '_blank')
      toast.success('💬 Opening WhatsApp...')
    } else {
      toast.error('Phone number not available for this retailer')
    }
  }

  const sendViaEmail = async () => {
    if (!shareInfo?.hasEmail) {
      toast.error('Email address not available for this retailer')
      return
    }

    setEmailSending(true)
    try {
      const response = await fetch(`/api/invoices?order_id=${orderId}&action=send`)
      const data = await response.json()
      
      if (data.success && data.emailSent) {
        toast.success(`✅ Invoice emailed to ${shareInfo.emailAddress}`)
      } else {
        toast.error('Failed to send email')
      }
    } catch (error) {
      toast.error('Error sending email')
      console.error('Email error:', error)
    } finally {
      setEmailSending(false)
    }
  }

  const copyInvoiceLink = () => {
    if (shareInfo?.viewUrl) {
      navigator.clipboard.writeText(shareInfo.viewUrl)
      toast.success('🔗 Invoice link copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading invoice options...</span>
      </div>
    )
  }

  if (compact) {
    // Compact layout for tables or lists
    return (
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={downloadInvoice}
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        {shareInfo?.canWhatsApp && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={shareViaWhatsApp}
            className="text-green-600 border-green-600 hover:bg-green-50"
            title="Share via WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
        
        {shareInfo?.hasEmail && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={sendViaEmail}
            disabled={emailSending}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            title="Send via Email"
          >
            {emailSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    )
  }

  // Full layout for order details pages
  return (
    <div className="space-y-4">
      {/* Status Alert */}
      {shareInfo && (
        <Alert className={shareInfo.hasEmail ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
          <CheckCircle className={shareInfo.hasEmail ? "h-4 w-4 text-green-600" : "h-4 w-4 text-blue-600"} />
          <AlertDescription>
            {shareInfo.hasEmail ? (
              <>
                <strong>Invoice {shareInfo.invoiceNumber}</strong> generated. 
                Email available for automatic delivery.
              </>
            ) : (
              <>
                <strong>Invoice {shareInfo.invoiceNumber}</strong> generated. 
                {shareInfo.canWhatsApp ? ' Share via WhatsApp or download.' : ' Download and share manually.'}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Download PDF */}
        <Button 
          onClick={downloadInvoice}
          variant="default"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>

        {/* WhatsApp Share */}
        {shareInfo?.canWhatsApp && (
          <Button 
            onClick={shareViaWhatsApp}
            variant="outline"
            className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4" />
            Share via WhatsApp
          </Button>
        )}

        {/* Email Send */}
        {shareInfo?.hasEmail && (
          <Button 
            onClick={sendViaEmail}
            disabled={emailSending}
            variant="outline"
            className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            {emailSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send via Email
              </>
            )}
          </Button>
        )}

        {/* Copy Link */}
        <Button 
          onClick={copyInvoiceLink}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Copy Link
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-600">
        {!shareInfo?.hasEmail && !shareInfo?.canWhatsApp && (
          <p className="flex items-center gap-2">
            ℹ️ No contact info available. Download PDF and share manually.
          </p>
        )}
        {!shareInfo?.hasEmail && shareInfo?.canWhatsApp && (
          <p className="flex items-center gap-2">
            💡 <span>Email not available. Use WhatsApp for instant delivery.</span>
          </p>
        )}
        {shareInfo?.hasEmail && (
          <p className="flex items-center gap-2">
            ✉️ <span>Email: {shareInfo.emailAddress}</span>
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Simple Invoice Button for quick access
 */
export function InvoiceButton({ orderId, variant = "outline", size = "default" }) {
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={() => window.open(`/api/invoices?order_id=${orderId}&action=view`, '_blank')}
    >
      📄 View Invoice
    </Button>
  )
}
