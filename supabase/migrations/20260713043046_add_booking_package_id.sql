-- 1. Add package_id to bookings
ALTER TABLE "public"."bookings" ADD COLUMN "package_id" UUID REFERENCES "public"."packages"("id");

-- 2. Backfill package_id from credit_transactions (Best Effort for historical data)
-- For bookings without package_id, find the matching credit transaction (by parent_id and notes)
UPDATE "public"."bookings" b
SET package_id = (
  SELECT ct.package_id
  FROM "public"."credit_transactions" ct
  WHERE ct.parent_id = b.parent_id
    AND ct.action_type = 'booking'
    AND (ct.notes = 'Booked session ' || b.session_id OR ct.notes = 'Batch Booked session ' || b.session_id)
  ORDER BY ct.created_at DESC
  LIMIT 1
)
WHERE b.package_id IS NULL AND b.status = 'confirmed';


-- 3. Update book_class_transactionally to store package_id
CREATE OR REPLACE FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_session_capacity INTEGER;
    v_session_trial_capacity INTEGER;
    v_session_date DATE;
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

    SELECT total_capacity, trial_capacity, session_date INTO v_session_capacity, v_session_trial_capacity, v_session_date
    FROM sessions WHERE id = p_session_id FOR UPDATE;

    IF v_session_capacity IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found.');
    END IF;

    SELECT COUNT(*) INTO v_current_booked
    FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';

    IF v_current_booked >= v_session_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is fully booked.');
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


-- 4. Update book_classes_batch to store package_id
CREATE OR REPLACE FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_session_id uuid;
    v_session_capacity INTEGER;
    v_session_trial_capacity INTEGER;
    v_session_date DATE;
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

    -- We loop through all requested sessions
    FOREACH v_session_id IN ARRAY p_session_ids
    LOOP
        -- 1. Check if already booked
        SELECT EXISTS (
            SELECT 1 FROM bookings 
            WHERE child_id = p_child_id AND session_id = v_session_id AND status = 'confirmed'
        ) INTO v_booking_exists;
        
        IF v_booking_exists THEN
            RAISE EXCEPTION 'Child is already booked for one of the selected sessions.';
        END IF;

        -- 2. Check capacity
        SELECT total_capacity, trial_capacity, session_date INTO v_session_capacity, v_session_trial_capacity, v_session_date
        FROM sessions WHERE id = v_session_id FOR UPDATE;

        IF v_session_capacity IS NULL THEN
            RAISE EXCEPTION 'Session not found.';
        END IF;

        SELECT COUNT(*) INTO v_current_booked
        FROM bookings WHERE session_id = v_session_id AND status = 'confirmed';

        IF v_current_booked >= v_session_capacity THEN
            RAISE EXCEPTION 'One of the selected sessions is fully booked.';
        END IF;

        -- 3. Find available package and deduct 1 credit
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

        -- 4. Create booking with package_id
        INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id, is_trial, package_id)
        VALUES (p_child_id, v_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id, v_package_type = 'trial', v_package_id);

    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 5. Update cancel_booking to refund to bookings.package_id
CREATE OR REPLACE FUNCTION "public"."cancel_booking"("p_booking_id" "uuid", "p_package_id" "uuid" DEFAULT NULL::"uuid", "p_cancelled_by" "text" DEFAULT 'parent'::"text", "p_cancel_reason" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_status TEXT;
    v_parent_id UUID;
    v_child_id UUID;
    v_session_date DATE;
    v_pkg_id UUID;
    v_bkk_date DATE;
    v_bkk_hour INT;
    v_child_nickname TEXT;
    v_caller_uid UUID;
    v_is_admin BOOLEAN;
BEGIN
    v_caller_uid := auth.uid();
    v_is_admin := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';

    SELECT status, parent_id, child_id, session_date, package_id
    INTO v_status, v_parent_id, v_child_id, v_session_date, v_pkg_id
    FROM bookings WHERE id = p_booking_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Booking not found / ไม่พบข้อมูลการจอง';
    END IF;

    IF NOT v_is_admin AND v_parent_id != v_caller_uid THEN
        RAISE EXCEPTION 'Unauthorized: Can only cancel own bookings';
    END IF;

    IF v_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled / คลาสนี้ถูกยกเลิกไปแล้ว';
    END IF;

    IF NOT v_is_admin AND p_cancelled_by = 'parent' THEN
        v_bkk_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date;
        v_bkk_hour := EXTRACT(HOUR FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'))::INT;
        IF v_session_date = v_bkk_date AND v_bkk_hour >= 7 THEN
            RAISE EXCEPTION 'เลยเวลา 7:00 แล้ว ติดต่อทีมโดยตรงนะคะ';
        END IF;
    END IF;

    -- If explicitly provided (e.g. by an admin override), use that package
    IF p_package_id IS NOT NULL THEN
        v_pkg_id := p_package_id;
    END IF;

    -- Fallback for legacy bookings that might not have a package_id set
    IF v_pkg_id IS NULL THEN
        SELECT id INTO v_pkg_id FROM packages
        WHERE parent_id = v_parent_id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    UPDATE bookings SET
        status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        cancelled_by = p_cancelled_by,
        cancel_reason = p_cancel_reason
    WHERE id = p_booking_id;

    IF v_pkg_id IS NOT NULL THEN
        UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = v_pkg_id;
        INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
        VALUES (v_parent_id, v_pkg_id, 'cancel', 1, COALESCE(p_cancel_reason, p_cancelled_by || ' cancel'));
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
