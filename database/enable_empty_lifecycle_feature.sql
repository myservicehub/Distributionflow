-- ============================================
-- ENABLE EMPTY BOTTLE LIFECYCLE FEATURE
-- This script upgrades your subscription to include empty_lifecycle feature
-- ============================================

-- Step 1: Check your current business and subscription
SELECT 
    b.id as business_id,
    b.name as business_name,
    bs.plan_id,
    p.name as plan_name,
    p.features,
    bs.status as subscription_status,
    bs.trial_ends_at,
    bs.current_period_end
FROM businesses b
LEFT JOIN business_subscriptions bs ON b.id = bs.business_id
LEFT JOIN subscription_plans p ON bs.plan_id = p.id
WHERE b.owner_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
)
ORDER BY b.created_at DESC
LIMIT 1;

-- ============================================
-- STEP 2: GET BUSINESS PLAN ID (with empty_lifecycle feature)
-- ============================================
SELECT 
    id,
    name,
    price_monthly,
    features->>'empty_lifecycle' as has_empty_lifecycle
FROM subscription_plans
WHERE features->>'empty_lifecycle' = 'true'
ORDER BY price_monthly ASC
LIMIT 1;

-- ============================================
-- STEP 3: UPGRADE TO BUSINESS PLAN WITH EMPTY LIFECYCLE
-- Run this to upgrade your subscription
-- ============================================

-- First, let's get the Business plan ID and your business ID
DO $$
DECLARE
    v_business_id UUID;
    v_business_plan_id UUID;
    v_current_subscription_id UUID;
BEGIN
    -- Get your business ID (assumes you're the owner)
    SELECT b.id INTO v_business_id
    FROM businesses b
    INNER JOIN users u ON b.owner_id = u.id
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1;

    -- Get Business plan ID (has empty_lifecycle feature)
    SELECT id INTO v_business_plan_id
    FROM subscription_plans
    WHERE features->>'empty_lifecycle' = 'true'
    ORDER BY price_monthly ASC
    LIMIT 1;

    -- Check if subscription exists
    SELECT id INTO v_current_subscription_id
    FROM business_subscriptions
    WHERE business_id = v_business_id;

    IF v_current_subscription_id IS NOT NULL THEN
        -- Update existing subscription
        UPDATE business_subscriptions
        SET 
            plan_id = v_business_plan_id,
            status = 'trial',
            trial_ends_at = NOW() + INTERVAL '30 days',
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '30 days',
            updated_at = NOW()
        WHERE id = v_current_subscription_id;
        
        RAISE NOTICE 'Subscription updated! Business ID: %, Plan: Business (Trial)', v_business_id;
    ELSE
        -- Create new subscription
        INSERT INTO business_subscriptions (
            business_id,
            plan_id,
            status,
            trial_ends_at,
            current_period_start,
            current_period_end
        ) VALUES (
            v_business_id,
            v_business_plan_id,
            'trial',
            NOW() + INTERVAL '30 days',
            NOW(),
            NOW() + INTERVAL '30 days'
        );
        
        RAISE NOTICE 'New subscription created! Business ID: %, Plan: Business (Trial)', v_business_id;
    END IF;

    -- Output confirmation
    RAISE NOTICE '✅ Empty Lifecycle feature is now enabled!';
    RAISE NOTICE '✅ Trial period: 30 days';
    RAISE NOTICE '✅ You can now access all empty bottle features';
END $$;

-- ============================================
-- STEP 4: VERIFY THE UPGRADE
-- Run this to confirm the feature is enabled
-- ============================================
SELECT 
    b.id as business_id,
    b.name as business_name,
    p.name as plan_name,
    p.features->>'empty_lifecycle' as empty_lifecycle_enabled,
    bs.status as subscription_status,
    bs.trial_ends_at,
    CASE 
        WHEN bs.trial_ends_at > NOW() THEN 'Active Trial'
        WHEN bs.status = 'active' THEN 'Active Subscription'
        ELSE bs.status
    END as access_status
FROM businesses b
LEFT JOIN business_subscriptions bs ON b.id = bs.business_id
LEFT JOIN subscription_plans p ON bs.plan_id = p.id
WHERE b.owner_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
)
ORDER BY b.created_at DESC
LIMIT 1;

-- ============================================
-- EXPECTED RESULT:
-- empty_lifecycle_enabled: true
-- subscription_status: trial
-- access_status: Active Trial
-- ============================================
