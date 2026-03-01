# 📋 STEP-BY-STEP SETUP GUIDE
## Staff Management Feature Configuration

Follow these steps exactly to complete the setup.

---

## 🔑 STEP 1: Add Service Role Key to .env File

### Part A: Get Your Service Role Key from Supabase

1. **Open your web browser** and go to: https://app.supabase.com

2. **Login to your account** (if not already logged in)

3. **Find and click on your project**
   - You should see your project listed (the one you created for DistributionFlow)
   - Project name is likely something like "distributionflow" or similar

4. **Navigate to Settings**
   - Look at the left sidebar
   - At the bottom, you'll see a gear icon ⚙️ with "Project Settings" or just "Settings"
   - Click on it

5. **Go to API Settings**
   - In the Settings menu, look for "API" option
   - Click on "API"

6. **Find the Service Role Key**
   - You'll see a section called "Project API keys"
   - You'll see multiple keys listed:
     - `anon` `public` (you already have this one)
     - `service_role` (this is the one you need!)
   - Look for the row labeled **"service_role"**

7. **Copy the Service Role Key**
   - Find the service_role key (it's a long string starting with "eyJ...")
   - Click the copy icon 📋 next to it
   - **⚠️ IMPORTANT:** This key is SECRET! Never share it publicly or commit to Git

---

### Part B: Add the Key to Your .env File

Now that you have the service_role key copied, let's add it to your environment file.

**Option 1: Using File Manager (if available)**

1. Navigate to `/app/` folder
2. Find the file named `.env` (it starts with a dot)
3. Open it in a text editor
4. Scroll to the bottom
5. Add a new line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here
   ```
6. Replace `paste_your_key_here` with the actual key you copied
7. Save the file

**Option 2: Using Command Line (preferred)**

Open your terminal/command line and run these commands:

```bash
# Navigate to app directory
cd /app

# Open the .env file in nano editor
nano .env
```

Once the file opens:
1. Use arrow keys to move to the bottom of the file
2. Press Enter to create a new line
3. Type: `SUPABASE_SERVICE_ROLE_KEY=`
4. Paste your copied service role key right after the `=` (no spaces!)
5. Your line should look like:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
   ```
6. Press `Ctrl + X` to exit
7. Press `Y` to save
8. Press `Enter` to confirm

**Verify the file:**
```bash
# Check if the key was added correctly
cat .env | grep SERVICE_ROLE
```
You should see your new line with the service role key.

---

### Part C: Restart the Server

Now restart the Next.js server to load the new environment variable:

```bash
sudo supervisorctl restart nextjs
```

Wait 3-5 seconds, then check if it's running:

```bash
sudo supervisorctl status nextjs
```

You should see: `nextjs    RUNNING`

✅ **Step 1 Complete!** The service role key is now configured.

---

## 🔒 STEP 2: Apply RLS Policies to Supabase Database

Now we need to add the database policies that allow admins to manage staff.

### Part A: Get the SQL Script

**Option 1: View the file content**

In your terminal, run:
```bash
cat /app/database/add_staff_management_policies.sql
```

This will display the SQL script. **Select all the text** and copy it (Ctrl+C or Cmd+C).

**Option 2: Download the file**

If you have file access, open `/app/database/add_staff_management_policies.sql` in a text editor, select all (Ctrl+A), and copy (Ctrl+C).

---

### Part B: Execute the SQL in Supabase

1. **Go back to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Make sure you're in the correct project

2. **Open SQL Editor**
   - Look at the left sidebar
   - Find the icon that looks like `</>`  or labeled "SQL Editor"
   - Click on it

3. **Create a New Query**
   - You'll see a button that says "+ New query" or similar
   - Click it to open a blank SQL editor

4. **Paste the SQL Script**
   - Click in the editor area
   - Paste the SQL script you copied (Ctrl+V or Cmd+V)
   - You should see all the SQL statements starting with `CREATE POLICY...`

5. **Run the Script**
   - Look for a button that says "Run" or shows a play icon ▶️
   - Click it to execute the SQL
   - Wait for it to complete (usually takes 1-2 seconds)

6. **Check for Success**
   - You should see a message like:
     - "Success. No rows returned" ✅
     - Or "4 statements executed successfully" ✅
   - If you see any errors, copy the error message and share it with me

---

### Part C: Verify the Policies Were Created

To confirm the policies are in place, run this verification query in the SQL Editor:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
```

Click "Run" and you should see a list of policies including:
- `admin_create_users`
- `admin_delete_users`
- `admin_update_users`
- `admin_view_all_users`
- Plus the original policies like `view_self`, `create_self`, etc.

✅ **Step 2 Complete!** The RLS policies are now active.

---

## 🧪 STEP 3: Test the Staff Management Feature

Now let's test if everything is working!

1. **Open your application**
   - Go to your app URL (e.g., `http://localhost:3000` or your preview URL)

2. **Login as Admin**
   - Use your admin account credentials
   - (The account you created during initial setup)

3. **Navigate to Staff Page**
   - Look at the left sidebar
   - You should now see a "Staff" menu item with a user icon 👥
   - Click on it

4. **Try Creating a Staff Member**
   - Click the "Add Staff Member" button
   - Fill in the form:
     - Name: `Test Manager`
     - Email: `testmanager@example.com`
     - Role: Select `Manager`
   - Click "Create Staff Member"

5. **Expected Result:**
   - A dialog should appear showing a temporary password
   - Something like: `Tempx8a4b7!42`
   - Copy this password (use the copy button)
   - The new staff member should appear in the table

6. **Test the New Account (Optional)**
   - Logout from your admin account
   - Try logging in with:
     - Email: `testmanager@example.com`
     - Password: (the temp password you copied)
   - You should be able to login
   - Notice that the "Staff" menu is NOT visible (only admins can see it)
   - This confirms role-based access is working!

---

## ✅ Success Checklist

Mark off each item as you complete it:

- [ ] Copied service_role key from Supabase Dashboard
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` to `/app/.env`
- [ ] Restarted Next.js server
- [ ] Verified server is running
- [ ] Copied SQL script from `/app/database/add_staff_management_policies.sql`
- [ ] Pasted and ran SQL in Supabase SQL Editor
- [ ] Verified policies were created successfully
- [ ] Logged into app as admin
- [ ] Saw "Staff" menu item in sidebar
- [ ] Created a test staff member successfully
- [ ] Received temporary password
- [ ] (Optional) Tested logging in as new staff member

---

## 🆘 Troubleshooting

### Problem: Can't find service_role key in Supabase
**Solution:** Make sure you're in Project Settings → API section. The service_role key should be listed under "Project API keys". If you don't see it, you might need owner/admin access to the Supabase project.

### Problem: Server won't restart
**Solution:**
```bash
# Check what's wrong
sudo supervisorctl status nextjs

# View logs
tail -n 50 /var/log/supervisor/nextjs.err.log

# Try restarting all services
sudo supervisorctl restart all
```

### Problem: SQL script gives error "policy already exists"
**Solution:** This means the policies are already there! You can skip this step or run:
```sql
-- Drop and recreate (only if needed)
DROP POLICY IF EXISTS "admin_view_all_users" ON users;
DROP POLICY IF EXISTS "admin_create_users" ON users;
DROP POLICY IF EXISTS "admin_update_users" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;
```
Then run the create policies script again.

### Problem: "Add Staff Member" button doesn't work
**Solution:**
1. Open browser console (F12)
2. Click the button again
3. Look for error messages
4. Check if the service_role key was added correctly:
   ```bash
   cat /app/.env | grep SERVICE_ROLE
   ```

### Problem: Getting 500 error when creating staff
**Solution:** Check server logs:
```bash
tail -n 100 /var/log/supervisor/nextjs.out.log
```
Look for error messages about "supabaseKey is required" - this means the service role key wasn't loaded. Make sure you restarted the server.

---

## 📞 Need Help?

If you encounter any issues:

1. **Check the server logs:**
   ```bash
   tail -n 50 /var/log/supervisor/nextjs.err.log
   ```

2. **Verify environment variable:**
   ```bash
   cat /app/.env | grep SUPABASE
   ```

3. **Check if server is running:**
   ```bash
   sudo supervisorctl status
   ```

4. **Share the error message with me** and I'll help you resolve it!

---

## 🎉 What's Next?

Once setup is complete, you can:
- Create staff members with different roles (Admin, Manager, Sales Rep, Warehouse)
- Edit existing staff member roles
- Deactivate staff members when needed
- Each staff member gets their own login credentials
- Role-based access control is automatically enforced

**Future Enhancements Available:**
- Force password change on first login
- Email invitations instead of manual password sharing
- Password reset functionality
- More granular role permissions throughout the app
