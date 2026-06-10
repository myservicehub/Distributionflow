# FINAL FIX: Force Supabase PostgREST Restart

The schema cache reload isn't working. You need to **force restart** the PostgREST service in Supabase.

## Option 1: Restart PostgREST via SQL (Try This First)

Run these commands **one by one** in Supabase SQL Editor:

```sql
-- 1. Reload schema cache (more forcefully)
SELECT pg_notify('pgrst', 'reload schema');

-- 2. Also try the alternative command
NOTIFY pgrst, 'reload config';

-- 3. Check if there are any views that reference subtotal
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND view_definition LIKE '%subtotal%';
```

## Option 2: Restart Your Supabase Project

If Option 1 doesn't work:

1. Go to **Supabase Dashboard**
2. Go to **Project Settings** (gear icon in left sidebar, bottom)
3. Scroll down to **"Pause project"** or **"Restart project"**
4. Click **Pause** → Wait 30 seconds → Click **Resume**

This will fully restart all Supabase services including PostgREST.

## Option 3: Workaround - Don't Use `.select()` After Insert

If restarting doesn't work, I can modify the code to not use `.select()` and manually construct the order response instead. This will bypass the schema cache issue entirely.

---

**Which option do you want to try?**
1. Run the SQL commands above
2. Restart your Supabase project  
3. Let me implement the workaround code

Let me know and I'll help you through it!
