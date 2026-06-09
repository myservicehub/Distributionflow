-- Force refresh Supabase PostgREST schema cache
-- Run this to clear the cached schema that's causing the foreign key lookup error

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Alternative: You can also restart your Supabase project from the dashboard
-- Settings > General > Restart project

-- After running this, wait 10-30 seconds for the cache to refresh
-- Then try accessing /api/stock-movements again
