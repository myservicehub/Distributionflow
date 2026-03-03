-- ============================================
-- MIGRATE EXISTING ORDERS TO NEW WORKFLOW
-- ============================================
-- This script updates existing legacy orders to work with the new delivery workflow

-- OPTION 1: Migrate ONLY confirmed/pending orders to new workflow
-- (Recommended - keeps completed/cancelled orders as legacy)

UPDATE orders
SET 
  is_legacy_order = FALSE,
  order_status = CASE 
    WHEN status = 'pending' THEN 'pending'::order_status_enum
    WHEN status = 'confirmed' THEN 'confirmed'::order_status_enum
    ELSE order_status
  END,
  delivery_status = CASE 
    WHEN status = 'pending' THEN 'not_started'::delivery_status_enum
    WHEN status = 'confirmed' THEN 'preparing'::delivery_status_enum
    ELSE delivery_status
  END
WHERE is_legacy_order = TRUE 
  AND status IN ('pending', 'confirmed');

-- Set confirmed_at for already confirmed orders (use created_at as fallback)
UPDATE orders
SET confirmed_at = created_at
WHERE is_legacy_order = FALSE 
  AND order_status = 'confirmed' 
  AND confirmed_at IS NULL;

-- Display migration results
SELECT 
  'Migration Complete' as status,
  COUNT(CASE WHEN is_legacy_order = FALSE AND order_status = 'confirmed' THEN 1 END) as confirmed_ready_for_delivery,
  COUNT(CASE WHEN is_legacy_order = FALSE AND order_status = 'pending' THEN 1 END) as pending_awaiting_approval,
  COUNT(CASE WHEN is_legacy_order = TRUE THEN 1 END) as legacy_orders_kept
FROM orders;

-- Show orders now ready for delivery board
SELECT 
  id,
  order_status,
  delivery_status,
  created_at,
  is_legacy_order
FROM orders
WHERE is_legacy_order = FALSE 
  AND order_status = 'confirmed'
ORDER BY created_at DESC
LIMIT 10;
