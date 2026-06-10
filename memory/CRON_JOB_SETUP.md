# Cron Job Setup Guide

## Overview
The application has two cron job endpoints for automated subscription management:
1. `/api/cron/check-trials` - Expires trial subscriptions
2. `/api/cron/check-subscriptions` - General subscription checks

## Environment Configuration

### Required Environment Variable
Add the following to your `.env` file (already added in development):

```bash
CRON_API_KEY=7044f0b87c7db21675946765dd5441745ab3242add289292cf197c13e6ee2f62
```

**⚠️ IMPORTANT FOR PRODUCTION:**
- Generate a new secure key for production: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Never commit this key to version control
- Store securely in your deployment platform's environment variables

## Cron Job Endpoints

### 1. Check Trials Endpoint
**URL:** `POST /api/cron/check-trials` or `GET /api/cron/check-trials`

**What it does:**
- Finds all businesses with `subscription_status = 'trial'`
- Checks if `trial_end_date < current_date`
- Updates expired trials to `subscription_status = 'expired'`
- Logs events to `subscription_events` table

**Authentication:**
```bash
x-cron-api-key: YOUR_CRON_API_KEY
```

**Response:**
```json
{
  "success": true,
  "message": "Trial check completed",
  "expired": 0,
  "errors": 0,
  "total": 0
}
```

### 2. Check Subscriptions Endpoint
**URL:** `GET /api/cron/check-subscriptions`

**What it does:**
- Same as check-trials endpoint (calls the same function)
- Returns timestamp for monitoring

**Response:**
```json
{
  "success": true,
  "expired": 0,
  "errors": 0,
  "total": 0,
  "timestamp": "2026-06-10T12:48:23.682Z"
}
```

## Production Setup

### Option 1: Netlify Scheduled Functions (Recommended for Netlify Deploy)
If deploying to Netlify, create a scheduled function:

```javascript
// netlify/functions/scheduled-cron.js
const fetch = require('node-fetch')

exports.handler = async function(event, context) {
  const response = await fetch('YOUR_DOMAIN/api/cron/check-trials', {
    method: 'POST',
    headers: {
      'x-cron-api-key': process.env.CRON_API_KEY
    }
  })
  
  const result = await response.json()
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}
```

Then configure in `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

[functions]
  schedule = "0 2 * * *"  # Run daily at 2 AM UTC
```

### Option 2: External Cron Service (EasyCron, cron-job.org, etc.)

**EasyCron Setup:**
1. Go to https://www.easycron.com/
2. Create new cron job
3. Set URL: `https://your-domain.com/api/cron/check-trials`
4. Set Method: `POST`
5. Add Custom Header: `x-cron-api-key: YOUR_KEY`
6. Set Schedule: Daily at 2 AM UTC (`0 2 * * *`)

**cron-job.org Setup:**
1. Go to https://cron-job.org/
2. Create new cron job
3. URL: `https://your-domain.com/api/cron/check-trials`
4. Add Request Header: `x-cron-api-key: YOUR_KEY`
5. Schedule: Every day at 02:00 UTC

### Option 3: GitHub Actions (if using GitHub)

Create `.github/workflows/cron.yml`:
```yaml
name: Run Subscription Cron Jobs

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Call Check Trials Endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/check-trials \
            -H "x-cron-api-key: ${{ secrets.CRON_API_KEY }}" \
            -H "Content-Type: application/json"
```

Don't forget to add `CRON_API_KEY` to GitHub Secrets.

### Option 4: Vercel Cron Jobs (if deploying to Vercel)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-trials",
    "schedule": "0 2 * * *"
  }]
}
```

Update the cron route to check for Vercel's `Authorization: Bearer` header:
```javascript
// In route.js
const apiKey = request.headers.get('x-cron-api-key') || 
               request.headers.get('authorization')?.replace('Bearer ', '')
```

## Testing

### Test Locally
```bash
# Successful request
curl -X POST http://localhost:3000/api/cron/check-trials \
  -H "x-cron-api-key: 7044f0b87c7db21675946765dd5441745ab3242add289292cf197c13e6ee2f62"

# Should return: {"success": true, "message": "Trial check completed", ...}

# Unauthorized request (wrong key)
curl -X POST http://localhost:3000/api/cron/check-trials \
  -H "x-cron-api-key: wrong-key"

# Should return: {"error": "Unauthorized"}
```

### Test in Production
```bash
curl -X POST https://your-domain.com/api/cron/check-trials \
  -H "x-cron-api-key: YOUR_PRODUCTION_KEY"
```

## Monitoring

### Logs to Check
- **Success logs:** Check application logs for "Trial check complete: X expired"
- **Error logs:** Check for "Cron job error" messages
- **Unauthorized attempts:** Check for "Unauthorized cron request attempt"

### Database Verification
Query the `subscription_events` table to see trial expiration events:
```sql
SELECT * FROM subscription_events 
WHERE event_type = 'trial_expired' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Recommended Monitoring Setup
1. **Email Alerts:** Set up alerts when `errors > 0`
2. **Slack/Discord Webhook:** Send notification on completion
3. **Database Monitoring:** Track trial expirations over time
4. **API Monitoring:** Use UptimeRobot or similar to ping the endpoint

## Security Best Practices

1. **Rotate API Keys Regularly:** Change `CRON_API_KEY` every 90 days
2. **Use HTTPS Only:** Never send API key over HTTP
3. **Monitor Failed Attempts:** Alert on repeated unauthorized requests
4. **Limit IP Access (Optional):** Restrict to known cron service IPs
5. **Log All Requests:** Keep audit log of cron executions

## Troubleshooting

### "Server misconfiguration" Error
**Cause:** `CRON_API_KEY` environment variable is not set  
**Fix:** Add `CRON_API_KEY` to your `.env` or deployment platform environment variables

### "Unauthorized" Error
**Cause:** Invalid API key  
**Fix:** Verify the `x-cron-api-key` header matches the environment variable

### No Trials Expiring
**Cause:** No businesses have expired trials  
**Fix:** This is normal if all trials are still active. Query:
```sql
SELECT id, name, subscription_status, trial_end_date 
FROM businesses 
WHERE subscription_status = 'trial' 
AND trial_end_date < NOW();
```

### Endpoint Returns 404
**Cause:** Middleware or routing issue  
**Fix:** Verify `/api/cron/check-trials` is in the public pages list in `middleware.js`

## Recommended Schedule

**Daily at 2 AM UTC:** This timing ensures:
- Off-peak hours for most timezones
- Trials expire before business hours
- Consistent daily execution
- Allows time for manual intervention if needed

**Cron Expression:** `0 2 * * *`

## Status

✅ **Development:** Configured and tested  
⚠️ **Production:** Requires external cron service setup  
📝 **Action Required:** Choose and configure production cron service

## Files Modified
- `/app/.env` - Added `CRON_API_KEY`
- `/app/lib/supabase/middleware.js` - Added `/api/cron/check-trials` to public pages

## Related Files
- `/app/app/api/cron/check-trials/route.js` - Trial expiration endpoint
- `/app/app/api/cron/check-subscriptions/route.js` - Subscription check endpoint
- `/app/lib/subscription.js` - `checkAndExpireTrials()` function
