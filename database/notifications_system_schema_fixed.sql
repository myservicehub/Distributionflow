-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'order', 'inventory', 'staff', 'credit', 'system')),
  related_table TEXT,
  related_record_id UUID,
  triggered_by UUID REFERENCES users(id),
  target_role TEXT NOT NULL CHECK (target_role IN ('admin', 'manager', 'all')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_settings table for notification configuration
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{
    "notifications": {
      "payment_threshold": 50000,
      "low_stock_threshold": 10,
      "high_credit_threshold": 100000,
      "enabled_types": ["payment", "order", "inventory", "staff", "credit"]
    }
  }'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins and managers can read notifications for their business
CREATE POLICY "Users can read notifications for their business"
  ON notifications FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- RLS Policy: Only backend can insert notifications (using service role)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- RLS Policy: Admins can read settings for their business
CREATE POLICY "Admins can read business settings"
  ON business_settings FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policy: Admins can update settings for their business
CREATE POLICY "Admins can update business settings"
  ON business_settings FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policy: Admins can insert initial settings for their business
CREATE POLICY "Admins can insert business settings"
  ON business_settings FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

SELECT 'Notification system tables created successfully!' as status;
