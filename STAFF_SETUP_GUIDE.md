# SETUP GUIDE: Add Service Role Key for Staff Management

## What You Need

To enable Staff Management (creating new user accounts), you need to add your Supabase Service Role Key to the environment variables.

## Steps:

1. **Get Your Service Role Key from Supabase:**
   - Go to your Supabase Dashboard: https://app.supabase.com
   - Select your project
   - Go to **Settings** → **API**
   - Under "Project API keys", find the **service_role** key (⚠️ Keep this secret!)
   - Copy the key

2. **Add to Environment File:**
   - Open `/app/.env` file
   - Add this line:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

3. **Restart the Server:**
   ```bash
   sudo supervisorctl restart nextjs
   ```

## Why Is This Needed?

The Service Role Key allows the backend to:
- Create new Supabase Auth users (for staff members)
- Bypass Row Level Security when needed for admin operations
- Manage user accounts programmatically

## Security Note:

⚠️ **IMPORTANT:** The service_role key has full database access and should:
- NEVER be exposed to the frontend
- NEVER be committed to version control
- Only be used in server-side code
- Be kept secure like a production database password

## After Setup:

Once you've added the key and restarted the server, you'll be able to:
- Create new staff members from the Staff Management page
- Assign roles (Admin, Manager, Sales Rep, Warehouse)
- Generate temporary passwords for new staff
- Manage all team members in your business
