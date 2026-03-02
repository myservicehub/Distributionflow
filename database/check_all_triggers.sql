-- Check ALL triggers on the orders table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders'
ORDER BY trigger_name;

-- Also check what functions exist
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_name LIKE '%order%' OR routine_name LIKE '%audit%'
ORDER BY routine_name;
