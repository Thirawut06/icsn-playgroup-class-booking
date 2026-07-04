-- Fix admin_edit_user to prevent SQL injection and mass-assignment vulnerabilities

CREATE OR REPLACE FUNCTION public.admin_edit_user(p_table text, p_id uuid, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_query TEXT;
  v_key TEXT;
  v_value TEXT;
  v_updates TEXT[] := ARRAY[]::TEXT[];
  v_allowed_parents TEXT[] := ARRAY['name', 'phone', 'email', 'line_id'];
  v_allowed_children TEXT[] := ARRAY['full_name', 'nickname', 'dob', 'age', 'food_allergy', 'special_info', 'media_perm', 'no_photo_perm'];
BEGIN
  -- 1. Validate table name strictly
  IF p_table NOT IN ('parents', 'children') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  -- 2. Iterate through JSON keys and validate against whitelist
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    IF p_table = 'parents' AND v_key = ANY(v_allowed_parents) THEN
      v_updates := array_append(v_updates, quote_ident(v_key) || ' = ' || quote_literal(v_value));
    ELSIF p_table = 'children' AND v_key = ANY(v_allowed_children) THEN
      v_updates := array_append(v_updates, quote_ident(v_key) || ' = ' || quote_literal(v_value));
    ELSE
      -- Log or raise an exception for unauthorized column attempts
      RAISE EXCEPTION 'Disallowed or unknown column update attempted: %', v_key;
    END IF;
  END LOOP;

  -- 3. Execute update if there are valid fields to update
  IF array_length(v_updates, 1) > 0 THEN
    v_query := 'UPDATE ' || quote_ident(p_table) || ' SET ' || array_to_string(v_updates, ', ') || ' WHERE id = ' || quote_literal(p_id);
    EXECUTE v_query;
  END IF;
END;
$function$
;

-- Define adjust_credits securely to prevent over-granting and negative amounts logic errors
CREATE OR REPLACE FUNCTION public.adjust_credits(p_parent_id uuid, p_amount integer, p_reason text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_package_id UUID;
    v_new_credits INTEGER;
BEGIN
    -- Prevent extremely large credit adjustments
    IF p_amount > 100 OR p_amount < -100 THEN
        RAISE EXCEPTION 'Credit adjustment out of bounds';
    END IF;

    -- If amount is 0, do nothing
    IF p_amount = 0 THEN
        SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
        RETURN COALESCE(v_new_credits, 0);
    END IF;

    -- Add credits: Insert a new manual package
    IF p_amount > 0 THEN
        INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
        VALUES (p_parent_id, 'manual_adjustment', p_amount, true)
        RETURNING id INTO v_package_id;

        INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
        VALUES (p_parent_id, v_package_id, 'admin_adjust', p_amount, COALESCE(p_reason, 'Admin adjustment'));
    ELSE
        -- Deduction logic would go here if needed.
        -- For simplicity and security, we only allow positive adjustments through this RPC, 
        -- or require a more complex deduction logic if negative adjustments are needed.
        RAISE EXCEPTION 'Negative credit adjustments must be handled via specific package refunds or deduction flows.';
    END IF;

    SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
    RETURN COALESCE(v_new_credits, 0);
END;
$function$
;
