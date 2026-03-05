-- ============================================
-- SUPER ADMIN PLATFORM - DATABASE SCHEMA
-- ============================================

-- 1. CREATE PLATFORM ADMINS TABLE
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'super_admin' CHECK (role = 'super_admin'),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for platform_admins
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);
CREATE INDEX IF NOT EXISTS idx_platform_admins_auth_user_id ON platform_admins(auth_user_id);

-- 2. CREATE PLATFORM AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT, -- 'business', 'subscription', 'user', 'feature_flag'
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON platform_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON platform_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON platform_audit_logs(action);

-- 3. CREATE BUSINESS FEATURE OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS business_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_by UUID REFERENCES platform_admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, feature_name)
);

-- Create indexes for feature overrides
CREATE INDEX IF NOT EXISTS idx_feature_overrides_business ON business_feature_overrides(business_id);
CREATE INDEX IF NOT EXISTS idx_feature_overrides_feature ON business_feature_overrides(feature_name);

-- 4. CREATE IMPERSONATION SESSIONS TABLE
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES platform_admins(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for impersonation sessions
CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_business ON impersonation_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_token ON impersonation_sessions(token);

-- 5. UPDATE BUSINESSES TABLE - Add suspension and health fields
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES platform_admins(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100);

-- Create index for business status
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_health ON businesses(health_score);
CREATE INDEX IF NOT EXISTS idx_businesses_last_activity ON businesses(last_activity_at);

-- 6. CREATE PLATFORM METRICS CACHE TABLE (for performance)
CREATE TABLE IF NOT EXISTS platform_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT UNIQUE NOT NULL,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE FUNCTION: Calculate MRR
CREATE OR REPLACE FUNCTION calculate_platform_mrr()
RETURNS NUMERIC AS $$
DECLARE
  total_mrr NUMERIC;
BEGIN
  SELECT COALESCE(SUM(
    p.base_price + (GREATEST(0, (
      SELECT COUNT(*) FROM users 
      WHERE business_id = b.id AND status = 'active'
    ) - p.included_users) * p.price_per_extra_user)
  ), 0)
  INTO total_mrr
  FROM businesses b
  JOIN plans p ON p.id = b.plan_id
  WHERE b.subscription_status IN ('active', 'trial')
    AND b.status = 'active';
  
  RETURN total_mrr;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. CREATE FUNCTION: Calculate ARR
CREATE OR REPLACE FUNCTION calculate_platform_arr()
RETURNS NUMERIC AS $$
BEGIN
  RETURN calculate_platform_mrr() * 12;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. CREATE FUNCTION: Get Platform KPIs
CREATE OR REPLACE FUNCTION get_platform_kpis()
RETURNS TABLE (
  total_businesses BIGINT,
  active_businesses BIGINT,
  trial_businesses BIGINT,
  expired_businesses BIGINT,
  suspended_businesses BIGINT,
  total_active_users BIGINT,
  mrr NUMERIC,
  arr NUMERIC,
  arpu NUMERIC,
  new_signups_this_month BIGINT,
  churn_this_month BIGINT
) AS $$
DECLARE
  v_mrr NUMERIC;
  v_active_count BIGINT;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_businesses FROM businesses;
  SELECT COUNT(*) INTO active_businesses FROM businesses WHERE subscription_status = 'active' AND status = 'active';
  SELECT COUNT(*) INTO trial_businesses FROM businesses WHERE subscription_status = 'trial' AND status = 'active';
  SELECT COUNT(*) INTO expired_businesses FROM businesses WHERE subscription_status = 'expired';
  SELECT COUNT(*) INTO suspended_businesses FROM businesses WHERE status = 'suspended';
  
  -- Get total active users across all businesses
  SELECT COUNT(*) INTO total_active_users FROM users WHERE status = 'active';
  
  -- Calculate MRR and ARR
  v_mrr := calculate_platform_mrr();
  mrr := v_mrr;
  arr := v_mrr * 12;
  
  -- Calculate ARPU
  v_active_count := active_businesses;
  IF v_active_count > 0 THEN
    arpu := v_mrr / v_active_count;
  ELSE
    arpu := 0;
  END IF;
  
  -- New signups this month
  SELECT COUNT(*) INTO new_signups_this_month 
  FROM businesses 
  WHERE created_at >= date_trunc('month', NOW());
  
  -- Churn this month (businesses that expired this month)
  SELECT COUNT(*) INTO churn_this_month
  FROM businesses
  WHERE subscription_status = 'expired'
    AND subscription_end >= date_trunc('month', NOW())
    AND subscription_end < date_trunc('month', NOW()) + INTERVAL '1 month';
  
  RETURN QUERY SELECT 
    total_businesses,
    active_businesses,
    trial_businesses,
    expired_businesses,
    suspended_businesses,
    total_active_users,
    mrr,
    arr,
    arpu,
    new_signups_this_month,
    churn_this_month;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. CREATE FUNCTION: Get Business Health Score
CREATE OR REPLACE FUNCTION calculate_business_health(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 100;
  v_days_since_login INTEGER;
  v_orders_last_30_days INTEGER;
  v_payment_failures INTEGER;
BEGIN
  -- Check last login (max -30 points)
  SELECT EXTRACT(DAYS FROM NOW() - MAX(created_at))::INTEGER
  INTO v_days_since_login
  FROM audit_logs
  WHERE business_id = p_business_id
    AND action = 'user_login'
    AND created_at > NOW() - INTERVAL '30 days';
  
  IF v_days_since_login IS NULL OR v_days_since_login > 30 THEN
    v_score := v_score - 30;
  ELSIF v_days_since_login > 14 THEN
    v_score := v_score - 15;
  ELSIF v_days_since_login > 7 THEN
    v_score := v_score - 5;
  END IF;
  
  -- Check orders in last 30 days (max -30 points)
  SELECT COUNT(*)::INTEGER
  INTO v_orders_last_30_days
  FROM orders
  WHERE business_id = p_business_id
    AND created_at > NOW() - INTERVAL '30 days';
  
  IF v_orders_last_30_days = 0 THEN
    v_score := v_score - 30;
  ELSIF v_orders_last_30_days < 10 THEN
    v_score := v_score - 15;
  ELSIF v_orders_last_30_days < 50 THEN
    v_score := v_score - 5;
  END IF;
  
  -- Check payment failures (max -20 points)
  SELECT COUNT(*)::INTEGER
  INTO v_payment_failures
  FROM subscription_invoices
  WHERE business_id = p_business_id
    AND status = 'failed'
    AND created_at > NOW() - INTERVAL '90 days';
  
  IF v_payment_failures > 2 THEN
    v_score := v_score - 20;
  ELSIF v_payment_failures > 0 THEN
    v_score := v_score - 10;
  END IF;
  
  -- Check subscription status (-20 points)
  IF (SELECT subscription_status FROM businesses WHERE id = p_business_id) = 'expired' THEN
    v_score := v_score - 20;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. CREATE FUNCTION: Check Feature Access with Override
CREATE OR REPLACE FUNCTION has_feature_with_override(
  p_business_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_override BOOLEAN;
  v_override_enabled BOOLEAN;
  v_has_in_plan BOOLEAN;
  v_subscription_status TEXT;
BEGIN
  -- Check if business exists and is active
  SELECT subscription_status INTO v_subscription_status
  FROM businesses
  WHERE id = p_business_id;
  
  IF v_subscription_status NOT IN ('active', 'trial') THEN
    RETURN false;
  END IF;
  
  -- Check for feature override
  SELECT enabled INTO v_override_enabled
  FROM business_feature_overrides
  WHERE business_id = p_business_id
    AND feature_name = p_feature_name;
  
  v_has_override := FOUND;
  
  -- Check plan features
  SELECT COALESCE((p.features->p_feature_name)::boolean, false)
  INTO v_has_in_plan
  FROM businesses b
  INNER JOIN plans p ON p.id = b.plan_id
  WHERE b.id = p_business_id;
  
  -- If plan already has feature, use plan
  IF v_has_in_plan THEN
    RETURN true;
  END IF;
  
  -- If no plan feature, check override
  IF v_has_override THEN
    RETURN v_override_enabled;
  END IF;
  
  -- Default: no access
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 12. ENABLE RLS ON NEW TABLES
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- 13. RLS POLICIES (Block all client access - server-side only)
CREATE POLICY "No direct access to platform_admins"
  ON platform_admins FOR ALL
  USING (false);

CREATE POLICY "No direct access to platform_audit_logs"
  ON platform_audit_logs FOR ALL
  USING (false);

CREATE POLICY "No direct access to business_feature_overrides"
  ON business_feature_overrides FOR ALL
  USING (false);

CREATE POLICY "No direct access to impersonation_sessions"
  ON impersonation_sessions FOR ALL
  USING (false);

-- 14. CREATE TRIGGER: Update health scores daily (can be called via cron)
CREATE OR REPLACE FUNCTION update_all_business_health_scores()
RETURNS void AS $$
DECLARE
  business_record RECORD;
  new_score INTEGER;
BEGIN
  FOR business_record IN SELECT id FROM businesses WHERE status = 'active' LOOP
    new_score := calculate_business_health(business_record.id);
    UPDATE businesses 
    SET health_score = new_score, updated_at = NOW()
    WHERE id = business_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 
  'Super Admin Platform schema created successfully!' as status,
  (SELECT COUNT(*) FROM platform_admins) as platform_admins,
  (SELECT COUNT(*) FROM business_feature_overrides) as feature_overrides;
