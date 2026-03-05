# Cron Job Setup for Subscription Management

## Purpose
The subscription system requires a daily cron job to automatically:
- Expire trials that have reached their end date
- Update subscription statuses for expired subscriptions
- Log subscription events for audit trail

## Endpoint
```
GET /api/cron/check-subscriptions
```

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscriptions",
      "schedule": "0 0 * * *"
    }
  ]
}
```

2. The cron will run daily at midnight UTC

### Option 2: External Cron Service (EasyCron, cron-job.org, etc.)

1. Sign up for a cron service
2. Create a new cron job with:
   - URL: `https://yourdomain.com/api/cron/check-subscriptions`
   - Schedule: Daily at midnight (0 0 * * *)
   - Method: GET

### Option 3: Supabase pg_cron (If using Supabase)

1. Enable pg_cron extension in Supabase
2. Create a database function that calls your API endpoint
3. Schedule it with pg_cron

## Security Considerations

The endpoint is currently unprotected. For production, consider:

1. **Add API Key Authentication**:
```javascript
// In /app/app/api/cron/check-subscriptions/route.js
const apiKey = request.headers.get('x-cron-api-key')
if (apiKey !== process.env.CRON_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

2. **Use Vercel Cron Secret** (if using Vercel):
Vercel automatically adds `x-vercel-signature` header for verification

## Testing

Test the cron endpoint manually:
```bash
curl https://yourdomain.com/api/cron/check-subscriptions
```

Expected response:
```json
{
  "success": true,
  "expired": 2,
  "errors": 0,
  "total": 2,
  "timestamp": "2025-01-15T00:00:00.000Z"
}
```

## Monitoring

- Check logs regularly to ensure the cron is running
- Set up alerts if the cron fails
- Monitor the number of expired subscriptions

## Current Implementation Status

✅ Cron endpoint created at `/app/app/api/cron/check-subscriptions/route.js`
✅ Database functions ready
⚠️ Cron job NOT YET SCHEDULED - needs manual setup using one of the options above

## Next Steps

1. Choose a cron service option (Vercel Cron recommended)
2. Set up the scheduled job
3. Test to ensure it runs successfully
4. Add authentication for production
5. Set up monitoring/alerts
