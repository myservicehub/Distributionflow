-- ============================================
-- REAL-TIME NOTIFICATION SYSTEM
-- ============================================
-- Complete schema for notifications and business settings

-- ============================================
-- 1. BUSINESS SETTINGS TABLE
-- ============================================
-- Store configurable thresholds and preferences per business
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Financial Thresholds
  large_payment_threshold DECIMAL(15,2) DEFAULT 250000.00,
  
  -- Inventory Thresholds
  large_stock_deduction_threshold INTEGER DEFAULT 100,
  large_stock_deduction_type TEXT DEFAULT 'absolute' CHECK (large_stock_deduction_type IN ('absolute', 'percentage')),
  
  -- Notification Settings
  notification_retention_days INTEGER DEFAULT 90,
  enable_sound_notifications BOOLEAN DEFAULT true,
  enable_email_notifications BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id)
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- ============================================
-- 2. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Notification Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical')),
  
  -- Related Record (optional)
  related_table TEXT,
  related_record_id UUID,
  
  -- User Context
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('admin', 'manager', 'both')),
  
  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  action_type TEXT, -- e.g., 'payment_edited', 'stock_adjusted'
  metadata JSONB, -- Additional context data
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance indexes
  CONSTRAINT notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_composite ON notifications(business_id, is_read, created_at DESC);

-- ============================================
-- 3. RLS POLICIES FOR BUSINESS_SETTINGS
-- ============================================
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Admin can view their business settings
DROP POLICY IF EXISTS "Admin can view business settings" ON business_settings;
CREATE POLICY "Admin can view business settings"
ON business_settings
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admin can update their business settings
DROP POLICY IF EXISTS "Admin can update business settings" ON business_settings;
CREATE POLICY "Admin can update business settings"
ON business_settings
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admin can insert business settings
DROP POLICY IF EXISTS "Admin can insert business settings" ON business_settings;
CREATE POLICY "Admin can insert business settings"
ON business_settings
FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- 4. RLS POLICIES FOR NOTIFICATIONS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin and Manager can view notifications for their business
DROP POLICY IF EXISTS "Admin and Manager can view notifications" ON notifications;
CREATE POLICY "Admin and Manager can view notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
  AND (
    target_role = 'both' 
    OR target_role IN (
      SELECT role 
      FROM users 
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Admin and Manager can update notifications (mark as read)
DROP POLICY IF EXISTS "Admin and Manager can update notifications" ON notifications;
CREATE POLICY "Admin and Manager can update notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Only server/backend can insert notifications (service role)
-- No INSERT policy for authenticated users - must use API endpoint

-- ============================================
-- 5. FUNCTION TO AUTO-DELETE OLD NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '1 day' * (
    SELECT COALESCE(
      (SELECT notification_retention_days FROM business_settings WHERE business_id = notifications.business_id),
      90
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ENABLE REALTIME FOR NOTIFICATIONS
-- ============================================
-- This allows Supabase Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Notification system tables created successfully!' as status;

-- Show table structures
\d business_settings
\d notifications

-- Show RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('business_settings', 'notifications')
ORDER BY tablename, policyname;
