-- Approve Slip RPC to fix read-then-write race conditions in admin edge functions

CREATE OR REPLACE FUNCTION public.approve_slip(p_slip_id uuid, p_credits_to_add integer, p_notes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_parent_id UUID;
    v_package_id UUID;
    v_slip_package_id TEXT;
    v_new_credits INTEGER;
    v_child_nickname TEXT;
BEGIN
    -- 1. Admin Auth Check
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- 2. Fetch Slip
    SELECT parent_id, package_id INTO v_parent_id, v_slip_package_id 
    FROM slip_uploads 
    WHERE id = p_slip_id AND status = 'pending';

    IF v_parent_id IS NULL THEN
        RAISE EXCEPTION 'Slip not found or not in pending status';
    END IF;

    -- 3. Update Slip Status
    UPDATE slip_uploads 
    SET status = 'approved', reviewed_at = now() 
    WHERE id = p_slip_id;

    -- 4. Find or Create Package (Prioritize most recent)
    SELECT id INTO v_package_id 
    FROM packages 
    WHERE parent_id = v_parent_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF v_package_id IS NOT NULL THEN
        UPDATE packages 
        SET credits_remaining = credits_remaining + p_credits_to_add 
        WHERE id = v_package_id
        RETURNING credits_remaining INTO v_new_credits;
    ELSE
        INSERT INTO packages (parent_id, type, credits_remaining)
        VALUES (v_parent_id, COALESCE(v_slip_package_id, 'purchase'), p_credits_to_add)
        RETURNING id, credits_remaining INTO v_package_id, v_new_credits;
    END IF;

    -- 5. Record Transaction
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'topup', p_credits_to_add, COALESCE(p_notes, 'slip approved: ' || p_slip_id));

    -- 6. Fetch Child Nickname for notification
    SELECT nickname INTO v_child_nickname
    FROM children
    WHERE parent_id = v_parent_id
    LIMIT 1;

    RETURN json_build_object(
        'success', true, 
        'credits_added', p_credits_to_add,
        'new_total', v_new_credits,
        'child_nickname', COALESCE(v_child_nickname, 'ไม่ระบุ')
    )::jsonb;
END;
$function$;
