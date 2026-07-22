-- Add strict is_active validation to booking RPCs
CREATE OR REPLACE FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_session_capacity INTEGER;
    v_session_trial_capacity INTEGER;
    v_session_date DATE;
    v_session_is_active BOOLEAN;
    v_current_booked INTEGER;
    v_current_trial_booked INTEGER;
    v_package_id UUID;
    v_package_type TEXT;
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

    SELECT total_capacity, trial_capacity, session_date, is_active INTO v_session_capacity, v_session_trial_capacity, v_session_date, v_session_is_active
    FROM sessions WHERE id = p_session_id FOR UPDATE;

    IF v_session_capacity IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found.');
    END IF;

    IF v_session_is_active = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is currently closed or inactive. (คลาสนี้ถูกปิดไปแล้ว)');
    END IF;

    SELECT COUNT(*) INTO v_current_booked
    FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';

    IF v_current_booked >= v_session_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is fully booked. (คลาสนี้เต็มแล้ว)');
    END IF;

    SELECT id, credits_remaining, type INTO v_package_id, v_credits_remaining, v_package_type
    FROM packages 
    WHERE parent_id = p_parent_id AND credits_remaining > 0
    ORDER BY created_at ASC
    LIMIT 1 
    FOR UPDATE; 

    IF v_package_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active credits available.');
    END IF;

    IF v_package_type = 'trial' THEN
        SELECT COUNT(*) INTO v_current_trial_booked
        FROM bookings WHERE session_id = p_session_id AND status = 'confirmed' AND is_trial = true;

        IF v_current_trial_booked >= v_session_trial_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'Trial slots for this session are fully booked. (โควต้าทดลองเรียนเต็มแล้ว)');
        END IF;
    END IF;

    UPDATE packages 
    SET credits_remaining = credits_remaining - 1 
    WHERE id = v_package_id;

    INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
    VALUES (p_parent_id, v_package_id, -1, 'booking', 'Booked session ' || p_session_id);

    INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id, is_trial, package_id)
    VALUES (p_child_id, p_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id, v_package_type = 'trial', v_package_id);

    RETURN jsonb_build_object('success', true);
END;
$$;


CREATE OR REPLACE FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_session_id uuid;
    v_session_capacity INTEGER;
    v_session_trial_capacity INTEGER;
    v_session_date DATE;
    v_session_is_active BOOLEAN;
    v_current_booked INTEGER;
    v_current_trial_booked INTEGER;
    v_package_id UUID;
    v_package_type TEXT;
    v_credits_remaining INTEGER;
    v_booking_exists BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
    IF NOT v_is_admin AND p_parent_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot book for another parent';
    END IF;

    FOREACH v_session_id IN ARRAY p_session_ids
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM bookings 
            WHERE child_id = p_child_id AND session_id = v_session_id AND status = 'confirmed'
        ) INTO v_booking_exists;
        
        IF v_booking_exists THEN
            RAISE EXCEPTION 'Child is already booked for one of the selected sessions.';
        END IF;

        SELECT total_capacity, trial_capacity, session_date, is_active INTO v_session_capacity, v_session_trial_capacity, v_session_date, v_session_is_active
        FROM sessions WHERE id = v_session_id FOR UPDATE;

        IF v_session_capacity IS NULL THEN
            RAISE EXCEPTION 'Session not found.';
        END IF;

        IF v_session_is_active = false THEN
            RAISE EXCEPTION 'One of the selected sessions is closed or inactive. (มีคลาสที่ถูกปิดไปแล้ว)';
        END IF;

        SELECT COUNT(*) INTO v_current_booked
        FROM bookings WHERE session_id = v_session_id AND status = 'confirmed';

        IF v_current_booked >= v_session_capacity THEN
            RAISE EXCEPTION 'One of the selected sessions is fully booked. (มีคลาสที่เต็มแล้ว)';
        END IF;

        SELECT id, credits_remaining, type INTO v_package_id, v_credits_remaining, v_package_type
        FROM packages 
        WHERE parent_id = p_parent_id AND credits_remaining > 0
        ORDER BY created_at ASC
        LIMIT 1 
        FOR UPDATE; 

        IF v_package_id IS NULL THEN
            RAISE EXCEPTION 'No active credits available for the full batch.';
        END IF;

        IF v_package_type = 'trial' THEN
            SELECT COUNT(*) INTO v_current_trial_booked
            FROM bookings WHERE session_id = v_session_id AND status = 'confirmed' AND is_trial = true;

            IF v_current_trial_booked >= v_session_trial_capacity THEN
                RAISE EXCEPTION 'Trial slots for one of the selected sessions are fully booked. (โควต้าทดลองเรียนเต็มแล้ว)';
            END IF;
        END IF;

        UPDATE packages 
        SET credits_remaining = credits_remaining - 1 
        WHERE id = v_package_id;

        INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
        VALUES (p_parent_id, v_package_id, -1, 'booking', 'Batch Booked session ' || v_session_id);

        INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id, is_trial, package_id)
        VALUES (p_child_id, v_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id, v_package_type = 'trial', v_package_id);

    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;
