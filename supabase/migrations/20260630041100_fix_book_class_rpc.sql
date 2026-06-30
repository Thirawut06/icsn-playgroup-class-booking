-- Fix book_class_transactionally to insert session_date
CREATE OR REPLACE FUNCTION public.book_class_transactionally(p_child_id uuid, p_session_id uuid, p_parent_id uuid, p_child_name text, p_parent_phone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_session_capacity INTEGER;
    v_session_date DATE;
    v_current_booked INTEGER;
    v_package_id UUID;
    v_credits_remaining INTEGER;
    v_booking_exists BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
    IF NOT v_is_admin AND p_parent_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot book for another parent';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM bookings 
        WHERE child_id = p_child_id AND session_id = p_session_id AND status = 'confirmed'
    ) INTO v_booking_exists;
    
    IF v_booking_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Child is already booked for this session.');
    END IF;

    SELECT total_capacity, session_date INTO v_session_capacity, v_session_date
    FROM sessions WHERE id = p_session_id FOR UPDATE;

    IF v_session_capacity IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found.');
    END IF;

    SELECT COUNT(*) INTO v_current_booked
    FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';

    IF v_current_booked >= v_session_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is fully booked.');
    END IF;

    SELECT id, credits_remaining INTO v_package_id, v_credits_remaining
    FROM packages 
    WHERE parent_id = p_parent_id AND credits_remaining > 0
    ORDER BY created_at ASC
    LIMIT 1 
    FOR UPDATE; 

    IF v_package_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active credits available.');
    END IF;

    UPDATE packages 
    SET credits_remaining = credits_remaining - 1 
    WHERE id = v_package_id;

    INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
    VALUES (p_parent_id, v_package_id, -1, 'booking', 'Booked session ' || p_session_id);

    INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id)
    VALUES (p_child_id, p_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id);

    RETURN jsonb_build_object('success', true);
END;
$function$
;
