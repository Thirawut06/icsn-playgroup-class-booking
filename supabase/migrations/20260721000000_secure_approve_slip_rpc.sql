-- Approve Slip RPC to fix read-then-write race conditions and ALWAYS create a new package instead of merging
-- Fixes the double-spending race condition and ensures non_refundable flags are preserved from the slip

CREATE OR REPLACE FUNCTION public.approve_slip(p_slip_id uuid, p_credits_to_add integer, p_notes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_parent_id UUID;
    v_package_id UUID;
    v_slip_package_id TEXT;
    v_non_refundable BOOLEAN;
    v_new_credits INTEGER;
    v_child_nickname TEXT;
BEGIN
    -- 1. Admin Auth Check
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- 2. Atomic Claim & Update Slip Status
    UPDATE slip_uploads 
    SET status = 'approved', reviewed_at = now() 
    WHERE id = p_slip_id AND status = 'pending'
    RETURNING parent_id, package_id, non_refundable INTO v_parent_id, v_slip_package_id, v_non_refundable;

    IF v_parent_id IS NULL THEN
        RAISE EXCEPTION 'Race condition detected: Slip is no longer pending or does not exist';
    END IF;

    -- 3. ALWAYS Create a New Package for the top-up
    INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
    VALUES (v_parent_id, COALESCE(v_slip_package_id, 'purchase'), p_credits_to_add, COALESCE(v_non_refundable, false))
    RETURNING id, credits_remaining INTO v_package_id, v_new_credits;

    -- 4. Record Transaction
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'topup', p_credits_to_add, COALESCE(p_notes, 'slip approved: ' || p_slip_id));

    -- 5. Fetch Child Nickname for notification
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
