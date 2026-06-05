# ONE-CLICK INVOICE SHARING - USER GUIDE

## Overview
Invoice sharing is now super easy with one-click buttons for WhatsApp, Email, and Download.

---

## 🎯 **How It Works**

### **After Manager Confirms Order:**

```
Manager clicks "Approve Order"
    ↓
Invoice automatically generated
    ↓
Sharing options appear:
- 📥 Download PDF
- 💬 Share via WhatsApp (one-click)
- ✉️ Send via Email (one-click)
- 🔗 Copy Link
```

---

## 📱 **Using the Invoice Actions**

### **1. Download PDF** 📥
**For:** Printing, saving, or manual sharing

**How to use:**
1. Click "Download PDF" button
2. PDF downloads to your device
3. Print or share via any app

**Use cases:**
- Print for physical delivery
- Save for records
- Share via any messaging app manually

---

### **2. Share via WhatsApp** 💬 (ONE-CLICK)
**For:** Instant delivery to retailer's WhatsApp

**How to use:**
1. Click "Share via WhatsApp" button
2. WhatsApp opens automatically
3. Pre-filled message with invoice link
4. Click Send

**Message sent:**
```
📄 Invoice INV-202406-A7B3C9

Hello ABC Store!

Your invoice for order #a7b3c9d2 is ready.

View/Download: [link]

Thank you for your business!
```

**Requirements:**
- Retailer must have phone number in system
- WhatsApp installed on your device

**Works when:**
- ✅ Retailer has phone or phone_number field
- ✅ You're on mobile or have WhatsApp Desktop

---

### **3. Send via Email** ✉️ (ONE-CLICK)
**For:** Professional email delivery with PDF attached

**How to use:**
1. Click "Send via Email" button
2. System sends email automatically
3. Success message shows email address
4. Retailer receives email with PDF

**Email includes:**
- Professional branded template
- PDF invoice attached
- Payment terms and details
- Contact information

**Requirements:**
- Retailer must have email in `owner_email` field

**Status indicators:**
- ✅ Green alert: "Email available for automatic delivery"
- 🔵 Blue alert: "No email on file. Share via WhatsApp"

---

### **4. Copy Link** 🔗
**For:** Sharing via SMS, Telegram, or any platform

**How to use:**
1. Click "Copy Link" button
2. Link copied to clipboard
3. Paste anywhere (SMS, email, chat)
4. Retailer clicks link to view/download

**Use cases:**
- Send via SMS
- Share on Telegram, Facebook, etc.
- Post in WhatsApp group
- Email manually

---

## 🎨 **Component Usage**

### **Full Layout (Order Details Page)**

```jsx
import { InvoiceActions } from '@/components/InvoiceActions'

<InvoiceActions 
  orderId={order.id}
  retailer={{
    shop_name: 'ABC Store',
    owner_email: 'abc@example.com',  // optional
    phone: '08012345678'              // optional
  }}
/>
```

**Shows:**
- Status alert (green if email, blue if WhatsApp only)
- All action buttons
- Help text and contact info

---

### **Compact Layout (Tables/Lists)**

```jsx
<InvoiceActions 
  orderId={order.id}
  retailer={order.retailer}
  compact={true}
/>
```

**Shows:**
- Icon-only buttons
- Smaller size
- Tooltip on hover

**Perfect for:**
- Order lists
- Data tables
- Sidebar widgets

---

### **Simple Button (Quick Access)**

```jsx
import { InvoiceButton } from '@/components/InvoiceActions'

<InvoiceButton orderId={order.id} />
```

**Shows:** Single "View Invoice" button that opens PDF in new tab

---

## 📊 **Automatic Detection**

The system automatically detects what's available:

### **Scenario 1: Email + Phone Available** ✅ BEST
```
Status: ✅ Email available for automatic delivery
Buttons: [Download] [WhatsApp] [Email] [Copy Link]
```

### **Scenario 2: Phone Only (No Email)** 💬
```
Status: 💡 Email not available. Use WhatsApp for instant delivery.
Buttons: [Download] [WhatsApp] [Copy Link]
```

### **Scenario 3: No Contact Info** 📥
```
Status: ℹ️ No contact info. Download PDF and share manually.
Buttons: [Download] [Copy Link]
```

---

## 🔄 **Integration Points**

### **Where to Add Invoice Actions:**

**1. Order Details Page**
```jsx
// After order information
{order.order_status === 'confirmed' && (
  <div className="mt-6">
    <h3 className="font-semibold mb-4">Invoice</h3>
    <InvoiceActions 
      orderId={order.id}
      retailer={order.retailer}
    />
  </div>
)}
```

**2. Orders List/Table**
```jsx
// In table actions column
<td>
  <InvoiceActions 
    orderId={order.id}
    retailer={order.retailer}
    compact={true}
  />
</td>
```

**3. Order Confirmation Modal**
```jsx
<Dialog>
  <DialogContent>
    <h2>Order Confirmed!</h2>
    <p>Invoice has been generated.</p>
    <InvoiceActions orderId={orderId} retailer={retailer} />
  </DialogContent>
</Dialog>
```

---

## 📧 **Adding Retailer Email**

To enable email delivery, add email during retailer creation:

### **In Retailer Form:**

```jsx
<Input
  label="Retailer Email (Optional)"
  name="owner_email"
  type="email"
  placeholder="retailer@example.com"
/>

<p className="text-sm text-gray-500">
  📧 Email enables automatic invoice delivery
</p>
```

### **Update Existing Retailers:**

**Via UI (Retailer Edit Page):**
1. Go to Retailers
2. Click Edit on retailer
3. Add email address
4. Save

**Via Database:**
```sql
UPDATE retailers 
SET owner_email = 'retailer@example.com' 
WHERE shop_name = 'ABC Store';
```

---

## 🎯 **Best Practices**

### **For Sales Reps:**
1. ✅ Always confirm retailer phone is correct
2. ✅ Use WhatsApp for fastest delivery
3. ✅ Download PDF if going for physical visit
4. ✅ Collect retailer emails when possible

### **For Managers:**
1. ✅ Encourage staff to collect emails
2. ✅ Verify invoices before sending
3. ✅ Follow up if retailer doesn't acknowledge
4. ✅ Keep records of sent invoices

### **For Admin:**
1. ✅ Ensure Resend API key is configured
2. ✅ Monitor email delivery success rates
3. ✅ Train staff on proper usage
4. ✅ Update retailer contacts regularly

---

## 🔧 **Troubleshooting**

### **WhatsApp button not working?**

**Check:**
- ✅ Retailer has phone number in database
- ✅ Phone format is correct (08012345678 or +2348012345678)
- ✅ WhatsApp is installed
- ✅ Pop-ups are allowed in browser

**Solution:**
1. Click "Copy Link" instead
2. Manually open WhatsApp
3. Paste link and send

---

### **Email button disabled?**

**Reason:** Retailer doesn't have email address

**Solution:**
1. Add email to retailer profile
2. Or use WhatsApp/Download instead

---

### **"Send via Email" fails?**

**Check:**
- ✅ Resend API key is valid
- ✅ Email address is correct
- ✅ Internet connection is stable

**Check logs:**
```bash
tail -f /var/log/supervisor/nextjs.out.log | grep -i invoice
```

---

### **Invoice not generating?**

**Ensure:**
- ✅ Order status is 'confirmed' or 'approved'
- ✅ Order has items
- ✅ Business and retailer info exists

**Manual trigger:**
```bash
# Regenerate invoice
POST /api/invoices
{
  "order_id": "order-uuid",
  "action": "send"
}
```

---

## 📊 **Usage Statistics**

### **Track Delivery Methods:**

```sql
-- Invoices sent by delivery method
SELECT 
  CASE 
    WHEN status = 'sent' THEN 'Email'
    ELSE 'Manual'
  END as delivery_method,
  COUNT(*) as count
FROM invoices
GROUP BY status;

-- Success rate
SELECT 
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as emailed,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as email_rate
FROM invoices;
```

---

## ✨ **Example Flow**

### **Complete User Journey:**

**1. Sales Rep creates order**
```
Login → Orders → Create New Order
→ Select retailer (ABC Store)
→ Add products
→ Submit order
→ Order status: Pending
```

**2. Manager reviews and approves**
```
Login → Orders → Pending Orders
→ Click on order
→ Review details
→ Click "Approve Order" ✅
→ Invoice auto-generated
```

**3. Share invoice with retailer**
```
Invoice Actions appear:
→ See status: "Email available" ✅
→ Click "Send via Email" ✅
→ Success: "Invoice emailed to abc@example.com"
→ Also click "Share via WhatsApp" 💬
→ WhatsApp opens with message
→ Click Send in WhatsApp
```

**4. Retailer receives invoice**
```
Option 1: Email
→ Opens email
→ Downloads PDF attachment
→ Views invoice

Option 2: WhatsApp
→ Sees message
→ Clicks link
→ Views/Downloads invoice in browser
```

---

## 🎓 **Training Staff**

### **Quick Training Script:**

**"After you approve an order, you'll see invoice sharing buttons:**

1. **📥 Download PDF** - For printing or saving
2. **💬 WhatsApp** - Click once, send via WhatsApp instantly
3. **✉️ Email** - Click once, automatically emails retailer (if email exists)
4. **🔗 Copy Link** - Copy and paste anywhere

**Always try WhatsApp first - it's the fastest!**

**If retailer has email, also send via email for their records.**

**Remember to collect retailer emails when adding new retailers!**"

---

## 📱 **Mobile Usage**

### **On Mobile Phones:**

**WhatsApp sharing:**
- ✅ Opens WhatsApp app directly
- ✅ Message pre-filled
- ✅ Just tap Send

**Email sharing:**
- ✅ Works same as desktop
- ✅ Sends instantly

**Download:**
- ✅ Downloads to phone
- ✅ Can share via any app

**Pro tip:** WhatsApp is most convenient on mobile!

---

## 🔮 **Future Enhancements**

Coming soon:
- ✅ SMS delivery with link
- ✅ Bulk invoice sending
- ✅ Scheduled invoice reminders
- ✅ Read receipts (did retailer view?)
- ✅ Payment tracking from invoice

---

**Questions?** Check `/app/INVOICE_SYSTEM_GUIDE.md` for complete technical documentation.
