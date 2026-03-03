-- Fix orders table status check constraint to include dispatched and delivered

-- Check current constraint
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%orders%status%';

-- Drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Create new constraint with all statuses
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'approved', 'rejected', 'cancelled', 'dispatched', 'delivered'));

-- Verify the constraint
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'orders_status_check';

SELECT 'Orders status constraint updated successfully!' as status;
