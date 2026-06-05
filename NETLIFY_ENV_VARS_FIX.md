# 🚨 URGENT: Add These Environment Variables to Netlify

## Step-by-Step Instructions

### 1. You're Already on the Right Page!
You're currently on: **Team Settings → Environment Variables**

### 2. Click "Add a variable" Button (Top Right)

### 3. Add Each Variable Below (One by One)

Copy and paste each variable **exactly** as shown:

---

#### **Variable 1: Supabase URL**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://ghleuwwnrerfanyfyclt.supabase.co
```

#### **Variable 2: Supabase Anon Key**
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobGV1d3ducmVyZmFueWZ5Y2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDQ1NTksImV4cCI6MjA4NzkyMDU1OX0.5pFbmyonMfNjE7CE-FQDco3IxYiBD0lKMY75QqJTIW8
```

#### **Variable 3: Supabase Service Role Key**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobGV1d3ducmVyZmFueWZ5Y2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0NDU1OSwiZXhwIjoyMDg3OTIwNTU5fQ.VdfZhacldTaYTMYYWDkqiYgnV58JQGOe8wgN_N4V_V0
```

#### **Variable 4: Supabase Database URL**
```
Key: SUPABASE_DATABASE_URL
Value: postgresql://postgres.ghleuwwnrerfanyfyclt:Ferayefa1999@@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

#### **Variable 5: Base URL**
```
Key: NEXT_PUBLIC_BASE_URL
Value: https://distribution-flow.com
```

#### **Variable 6: Resend API Key**
```
Key: RESEND_API_KEY
Value: re_hfMiKq64_EvvbjwDXF7EpAKjqCnpaFdMQ
```

#### **Variable 7: Resend From Email**
```
Key: RESEND_FROM_EMAIL
Value: noreply@distribution-flow.com
```

#### **Variable 8: CORS Origins**
```
Key: CORS_ORIGINS
Value: *
```

#### **Variable 9: Paystack Secret Key** (Optional - for payments)
```
Key: PAYSTACK_SECRET_KEY
Value: sk_test_YOUR_SECRET_KEY_HERE
```

#### **Variable 10: Paystack Public Key** (Optional - for payments)
```
Key: NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
Value: pk_test_YOUR_PUBLIC_KEY_HERE
```

---

### 4. For Each Variable:

1. Click **"Add a variable"**
2. **Key:** Paste the key name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value:** Paste the value
4. **Scopes:** Select "All" (or at least "Builds" and "Functions")
5. Click **"Create variable"**
6. Repeat for all variables above

---

### 5. After Adding All Variables:

**CRITICAL:** You MUST redeploy for changes to take effect!

**Option A: Trigger Redeploy from Netlify**
1. Go back to your project: **Projects → distribution-flow.com**
2. Click **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Deploy site"**
4. Wait 3-5 minutes for build to complete

**Option B: Push to GitHub (if connected)**
```bash
# Make any small change and push
git commit --allow-empty -m "Trigger rebuild with env vars"
git push origin main
```

---

### 6. Verify Variables Are Added

After adding all variables, you should see:

**Environment Variables (10)** ✅

Instead of:

**"No shared environment variables set for this team"** ❌

---

### 7. Test Your Site

After the redeploy completes:

1. Open https://distribution-flow.com in a **NEW incognito window**
2. Landing page should load properly
3. Go to /login
4. Try logging in
5. Dashboard should now show content (not blank!)

---

## ⚡ Quick Copy-Paste Format

If you prefer, here are all variables in one block:

```
NEXT_PUBLIC_SUPABASE_URL=https://ghleuwwnrerfanyfyclt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobGV1d3ducmVyZmFueWZ5Y2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDQ1NTksImV4cCI6MjA4NzkyMDU1OX0.5pFbmyonMfNjE7CE-FQDco3IxYiBD0lKMY75QqJTIW8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobGV1d3ducmVyZmFueWZ5Y2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0NDU1OSwiZXhwIjoyMDg3OTIwNTU5fQ.VdfZhacldTaYTMYYWDkqiYgnV58JQGOe8wgN_N4V_V0
SUPABASE_DATABASE_URL=postgresql://postgres.ghleuwwnrerfanyfyclt:Ferayefa1999@@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_BASE_URL=https://distribution-flow.com
RESEND_API_KEY=re_hfMiKq64_EvvbjwDXF7EpAKjqCnpaFdMQ
RESEND_FROM_EMAIL=noreply@distribution-flow.com
CORS_ORIGINS=*
```

---

## 🎯 Why This Fixes the Blank Page

**Without environment variables:**
- ❌ App can't connect to Supabase
- ❌ Authentication fails silently
- ❌ No data can be loaded
- ❌ React renders nothing = blank page

**With environment variables:**
- ✅ App connects to Supabase
- ✅ Authentication works
- ✅ Data loads properly
- ✅ Dashboard renders with content

---

## ⏱️ Time to Fix

- Adding variables: **5 minutes**
- Redeploying site: **3-5 minutes**
- **Total: 10 minutes to fix!**

---

## 📸 What You Should See

**After adding variables:**

Instead of "No shared environment variables", you should see a list like:

```
NEXT_PUBLIC_SUPABASE_URL          https://ghleuww... 
NEXT_PUBLIC_SUPABASE_ANON_KEY     eyJhbGciOiJIU...
SUPABASE_SERVICE_ROLE_KEY         eyJhbGciOiJIU...
NEXT_PUBLIC_BASE_URL              https://distri...
RESEND_API_KEY                    re_hfMiKq64_E...
... (and so on)
```

---

**START ADDING THE VARIABLES NOW AND YOUR SITE WILL WORK!** 🚀
