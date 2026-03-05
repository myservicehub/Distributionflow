-- Migration: Add target_roles array column to notifications table
-- Date: June 2025
-- Purpose: Enable role-specific notification targeting with support for multiple roles

-- Add target_roles column as text array
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS target_roles TEXT[];

-- Migrate existing target_role data to target_roles array
UPDATE notifications 
SET target_roles = ARRAY[target_role]::TEXT[]
WHERE target_roles IS NULL AND target_role IS NOT NULL;

-- Set default for rows where both are null
UPDATE notifications 
SET target_roles = ARRAY['admin', 'manager']::TEXT[]
WHERE target_roles IS NULL;

-- Create index for better query performance on target_roles
CREATE INDEX IF NOT EXISTS idx_notifications_target_roles 
ON notifications USING GIN (target_roles);

-- Add category column for notification categorization
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON notifications(category);

-- Update RLS Policies for Warehouse Users
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Warehouse users can view dispatch notifications" ON notifications;
DROP POLICY IF EXISTS "Admins and managers can view all notifications" ON notifications;

-- Policy: Warehouse users can only view notifications targeted to them
CREATE POLICY "Warehouse users can view dispatch notifications"
ON notifications
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE id = auth.uid()
  )
  AND (
    -- Check if user is warehouse and notification targets warehouse
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'warehouse'
      AND 'warehouse' = ANY(notifications.target_roles)
    )
    OR
    -- OR user is admin/manager (can see all)
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager')
    )
  )
);

-- Policy: Prevent warehouse from inserting/updating/deleting notifications
CREATE POLICY "Warehouse cannot modify notifications"
ON notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role != 'warehouse'
  )
);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications' 
AND column_name IN ('target_roles', 'category')
ORDER BY column_name;
