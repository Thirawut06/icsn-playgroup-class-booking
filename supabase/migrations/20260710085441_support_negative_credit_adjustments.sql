CREATE OR REPLACE FUNCTION "public"."adjust_credits"("p_parent_id" "uuid", "p_amount" integer, "p_reason" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_package_id UUID;
    v_new_credits INTEGER;
    v_deduct_amount INTEGER;
    v_pkg RECORD;
    v_take INTEGER;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    IF p_amount > 100 OR p_amount < -100 THEN
        RAISE EXCEPTION 'Credit adjustment out of bounds';
    END IF;

    IF p_amount = 0 THEN
        SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
        RETURN COALESCE(v_new_credits, 0);
    END IF;

    IF p_amount > 0 THEN
        INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
        VALUES (p_parent_id, 'manual_adjustment', p_amount, true)
        RETURNING id INTO v_package_id;

        INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
        VALUES (p_parent_id, v_package_id, 'admin_adjust', p_amount, COALESCE(p_reason, 'Admin adjustment'));
    ELSE
        -- Negative adjustment logic
        v_deduct_amount := ABS(p_amount);

        -- Check total available credits first
        SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
        IF COALESCE(v_new_credits, 0) < v_deduct_amount THEN
             RAISE EXCEPTION 'Not enough credits to deduct';
        END IF;

        FOR v_pkg IN 
            SELECT id, credits_remaining 
            FROM packages 
            WHERE parent_id = p_parent_id AND credits_remaining > 0 
            ORDER BY created_at ASC 
            FOR UPDATE
        LOOP
            IF v_deduct_amount <= 0 THEN
                EXIT;
            END IF;

            v_take := LEAST(v_pkg.credits_remaining, v_deduct_amount);
            
            UPDATE packages 
            SET credits_remaining = credits_remaining - v_take 
            WHERE id = v_pkg.id;
            
            INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
            VALUES (p_parent_id, v_pkg.id, 'admin_adjust', -v_take, COALESCE(p_reason, 'Admin negative adjustment'));

            v_deduct_amount := v_deduct_amount - v_take;
        END LOOP;

    END IF;

    SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
    RETURN COALESCE(v_new_credits, 0);
END;
$$;
