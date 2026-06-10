# Critical: Check for Subtotal References in Database

The error persists because something in your Supabase database is referencing a `subtotal` column. Run these queries to find it:

## Query 1: Check for Views
```sql
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND (table_name LIKE '%order%' OR view_definition LIKE '%subtotal%');
```

## Query 2: Check for Triggers
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders';
```

## Query 3: Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';
```

## Query 4: Check for Functions that reference orders
```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%subtotal%'
OR routine_definition LIKE '%orders%';
```

---

## After Running These Queries

**Please copy and paste ALL the results here.**

If any of these show `subtotal`, we need to either:
1. **Drop the view/trigger/policy** that references it
2. **Add the subtotal column** to the orders table
3. **Restart your entire Supabase project**

---

## OR - Just Restart Supabase Now (Recommended)

Since we've tried everything else, the fastest solution is:

### Steps to Restart Supabase:
1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Go to **Settings** (gear icon, bottom left)
4. Scroll to **"General"** section
5. Click **"Pause project"**
6. Wait 30 seconds
7. Click **"Unpause project"** or **"Resume"**
8. Wait 2-3 minutes for services to restart

This will completely clear the PostgREST schema cache.

**Which do you want to do?**
- Run the diagnostic queries above
- Just restart the Supabase project now
