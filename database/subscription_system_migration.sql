-- ============================================
-- HYBRID SUBSCRIPTION BILLING SYSTEM
-- Complete Database Schema Migration
-- ============================================

-- 1. CREATE PLANS TABLE
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  included_users INTEGER NOT NULL DEFAULT 1,
  price_per_extra_user NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_cycle_options JSONB DEFAULT '["monthly", "yearly"]'::jsonb,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for plans
CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- 2. UPDATE BUSINESSES TABLE
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'suspended')),
ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Create indexes for businesses subscription fields
CREATE INDEX IF NOT EXISTS idx_businesses_plan_id ON businesses(plan_id);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_trial_end ON businesses(trial_end_date);

-- 3. CREATE SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  base_price NUMERIC(10, 2) NOT NULL,
  included_users INTEGER NOT NULL,
  active_users INTEGER NOT NULL DEFAULT 0,
  extra_users INTEGER NOT NULL DEFAULT 0,
  price_per_extra_user NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed')),
  next_billing_date TIMESTAMP WITH TIME ZONE,
  payment_provider TEXT DEFAULT 'paystack',
  payment_provider_reference TEXT,
  payment_provider_subscription_code TEXT,
  payment_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_ref ON subscriptions(payment_provider_reference);

-- 4. CREATE SUBSCRIPTION INVOICES TABLE
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  extra_users_count INTEGER DEFAULT 0,
  extra_users_cost NUMERIC(10, 2) DEFAULT 0,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_provider_reference TEXT,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON subscription_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON subscription_invoices(invoice_number);

-- 5. CREATE SUBSCRIPTION EVENTS TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- trial_started, trial_expired, subscription_created, subscription_renewed, plan_upgraded, plan_downgraded, payment_succeeded, payment_failed
  previous_status TEXT,
  new_status TEXT,
  previous_plan_id UUID,
  new_plan_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_sub_events_business_id ON subscription_events(business_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sub_events_created ON subscription_events(created_at DESC);

-- 6. INSERT DEFAULT PLANS
INSERT INTO plans (name, display_name, description, base_price, included_users, price_per_extra_user, features, sort_order) 
VALUES 
(
  'starter',
  'Starter Plan',
  'Perfect for small businesses getting started',
  10000.00,
  3,
  2000.00,
  '{
    "empty_lifecycle": false,
    "multi_warehouse": false,
    "fraud_detection": false,
    "sms_alerts": false,
    "api_access": false,
    "advanced_reports": false,
    "max_retailers": 50,
    "max_products": 100
  }'::jsonb,
  1
),
(
  'business',
  'Business Plan',
  'For growing businesses with advanced needs',
  30000.00,
  10,
  2500.00,
  '{
    "empty_lifecycle": true,
    "multi_warehouse": false,
    "fraud_detection": true,
    "sms_alerts": true,
    "api_access": false,
    "advanced_reports": true,
    "max_retailers": 200,
    "max_products": 500
  }'::jsonb,
  2
),
(
  'enterprise',
  'Enterprise Plan',
  'Complete solution for large distributors',
  100000.00,
  999,
  3000.00,
  '{
    "empty_lifecycle": true,
    "multi_warehouse": true,
    "fraud_detection": true,
    "sms_alerts": true,
    "api_access": true,
    "advanced_reports": true,
    "priority_support": true,
    "custom_integrations": true,
    "max_retailers": 999999,
    "max_products": 999999
  }'::jsonb,
  3
)
ON CONFLICT (name) DO NOTHING;

-- 7. UPDATE EXISTING BUSINESSES TO TRIAL
-- Assign all existing businesses to trial with Starter plan
UPDATE businesses 
SET 
  plan_id = (SELECT id FROM plans WHERE name = 'starter' LIMIT 1),
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '14 days'
WHERE plan_id IS NULL;

-- 8. CREATE FUNCTION: Calculate Active Users
CREATE OR REPLACE FUNCTION get_active_users_count(p_business_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM users
    WHERE business_id = p_business_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. CREATE FUNCTION: Calculate Subscription Amount
CREATE OR REPLACE FUNCTION calculate_subscription_amount(
  p_business_id UUID,
  p_plan_id UUID DEFAULT NULL
)
RETURNS TABLE (
  plan_id UUID,
  plan_name TEXT,
  base_price NUMERIC,
  included_users INTEGER,
  active_users INTEGER,
  extra_users INTEGER,
  price_per_extra_user NUMERIC,
  extra_users_cost NUMERIC,
  total_amount NUMERIC,
  billing_cycle TEXT
) AS $$
DECLARE
  v_plan_id UUID;
  v_active_users INTEGER;
BEGIN
  -- Get plan_id (use provided or fetch from business)
  IF p_plan_id IS NOT NULL THEN
    v_plan_id := p_plan_id;
  ELSE
    SELECT b.plan_id INTO v_plan_id
    FROM businesses b
    WHERE b.business_id = p_business_id;
  END IF;

  -- Get active users count
  v_active_users := get_active_users_count(p_business_id);

  -- Calculate billing
  RETURN QUERY
  SELECT
    p.id AS plan_id,
    p.display_name AS plan_name,
    p.base_price,
    p.included_users,
    v_active_users AS active_users,
    GREATEST(0, v_active_users - p.included_users) AS extra_users,
    p.price_per_extra_user,
    GREATEST(0, v_active_users - p.included_users) * p.price_per_extra_user AS extra_users_cost,
    p.base_price + (GREATEST(0, v_active_users - p.included_users) * p.price_per_extra_user) AS total_amount,
    COALESCE(b.billing_cycle, 'monthly') AS billing_cycle
  FROM plans p
  LEFT JOIN businesses b ON b.business_id = p_business_id
  WHERE p.id = v_plan_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. CREATE FUNCTION: Check Feature Access
CREATE OR REPLACE FUNCTION has_feature(
  p_business_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_feature BOOLEAN;
  v_subscription_status TEXT;
BEGIN
  -- Check subscription status and feature
  SELECT 
    COALESCE((p.features->p_feature_name)::boolean, false),
    b.subscription_status
  INTO v_has_feature, v_subscription_status
  FROM businesses b
  INNER JOIN plans p ON p.id = b.plan_id
  WHERE b.business_id = p_business_id;

  -- Return false if subscription is not active (unless on trial)
  IF v_subscription_status NOT IN ('active', 'trial') THEN
    RETURN false;
  END IF;

  RETURN COALESCE(v_has_feature, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. CREATE FUNCTION: Get Next Invoice Number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
  v_month TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM subscription_invoices
  WHERE invoice_number LIKE 'INV-' || v_year || v_month || '%';
  
  RETURN 'INV-' || v_year || v_month || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 12. CREATE TRIGGER: Update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_timestamp();

-- 13. CREATE TRIGGER: Update plan updated_at
CREATE TRIGGER trigger_update_plan_timestamp
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_subscription_timestamp();

-- 14. Enable RLS on new tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies for plans (public read)
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- 16. RLS Policies for subscriptions (business access)
CREATE POLICY "Businesses can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- 17. RLS Policies for invoices (business access)
CREATE POLICY "Businesses can view own invoices"
  ON subscription_invoices FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- 18. RLS Policies for events (business access)
CREATE POLICY "Businesses can view own subscription events"
  ON subscription_events FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Success message
SELECT 
  'Subscription system schema created successfully!' as status,
  (SELECT COUNT(*) FROM plans) as plans_created,
  (SELECT COUNT(*) FROM businesses WHERE subscription_status = 'trial') as businesses_on_trial;
