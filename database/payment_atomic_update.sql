-- Atomic payment application to prevent race conditions
-- Run once in Supabase SQL editor before deploying Fix #4
--
-- This function atomically decrements retailer balance and
-- updates status in a single database transaction.

CREATE OR REPLACE FUNCTION apply_payment(
  p_retailer_id UUID,
  p_business_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE(new_balance NUMERIC, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC;
  v_credit_limit NUMERIC;
  v_new_status TEXT;
BEGIN
  -- Atomic update with implicit row lock
  UPDATE retailers
  SET
    current_balance = GREATEST(0, current_balance - p_amount),
    updated_at = NOW()
  WHERE
    id = p_retailer_id
    AND business_id = p_business_id
  RETURNING current_balance, credit_limit
  INTO v_new_balance, v_credit_limit;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Retailer not found: %', p_retailer_id;
  END IF;

  -- Calculate new status
  v_new_status := CASE
    WHEN v_new_balance <= v_credit_limit THEN 'active'
    ELSE 'blocked'
  END;

  -- Update status in same transaction
  UPDATE retailers
  SET status = v_new_status
  WHERE id = p_retailer_id AND business_id = p_business_id;

  RETURN QUERY SELECT v_new_balance, v_new_status;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION apply_payment TO authenticated;
GRANT EXECUTE ON FUNCTION apply_payment TO service_role;
