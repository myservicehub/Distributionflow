-- Migration: Add read_at and read_by columns to notifications table
-- Date: June 2025
-- Purpose: Fix "mark as read" functionality for notifications
-- 
-- This migration adds the missing columns that the frontend
-- NotificationBell component expects when marking notifications as read.

-- Add the read_at column to track when a notification was marked as read
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add the read_by column to track who marked the notification as read
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_by UUID REFERENCES users(id);

-- Create an index on read_at for better query performance when filtering read/unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Create an index on read_by for tracking user activity
CREATE INDEX IF NOT EXISTS idx_notifications_read_by ON notifications(read_by);

-- Optional: Create a combined index for common queries (business_id + read_at)
CREATE INDEX IF NOT EXISTS idx_notifications_business_read ON notifications(business_id, read_at);

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications' 
AND column_name IN ('read_at', 'read_by')
ORDER BY column_name;
