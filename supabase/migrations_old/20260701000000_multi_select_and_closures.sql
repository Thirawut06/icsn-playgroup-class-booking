-- 1. Create school_closures table
CREATE TABLE IF NOT EXISTS public.school_closures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

ALTER TABLE public.school_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to school_closures"
ON public.school_closures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage school_closures"
ON public.school_closures FOR ALL
TO authenticated
USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');


-- 2. Modify get_or_create_sessions_for_date to handle closures
CREATE OR REPLACE FUNCTION public.get_or_create_sessions_for_date(p_date date)
 RETURNS SETOF sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_locked_labels text[];
    v_has_templates boolean;
    v_closure_reason text;
BEGIN
    -- Check if date falls in a closure
    SELECT reason INTO v_closure_reason 
    FROM school_closures 
    WHERE p_date BETWEEN start_date AND end_date
    LIMIT 1;

    -- Delete empty sessions for this date (where no one has booked)
    DELETE FROM sessions 
    WHERE session_date = p_date AND (booked_count IS NULL OR booked_count = 0);

    -- Get array of time_labels for locked sessions (where someone has booked)
    SELECT array_agg(time_label) INTO v_locked_labels 
    FROM sessions 
    WHERE session_date = p_date AND booked_count > 0;

    IF v_closure_reason IS NOT NULL THEN
        -- If closed and no locked sessions, insert one closed session so UI can show it
        IF v_locked_labels IS NULL THEN
            INSERT INTO sessions (session_date, time_label, total_capacity, is_active, theme)
            VALUES (p_date, 'Closed', 0, false, v_closure_reason);
        END IF;
        
        RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label;
        RETURN;
    END IF;

    -- Check if any templates exist
    SELECT EXISTS (SELECT 1 FROM session_templates) INTO v_has_templates;

    IF NOT v_has_templates THEN
        IF v_locked_labels IS NULL THEN
            INSERT INTO sessions (session_date, time_label, total_capacity, is_active)
            VALUES (p_date, '9.00 - 10.30', 12, true);
        END IF;
    ELSE
        -- Insert new sessions from ALL templates
        INSERT INTO sessions (session_date, time_label, total_capacity, is_active)
        SELECT p_date, time_label, capacity, is_active
        FROM session_templates
        WHERE (v_locked_labels IS NULL OR time_label != ALL(v_locked_labels));
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label;
END;
$function$;


-- 3. Create book_classes_batch RPC
CREATE OR REPLACE FUNCTION public.book_classes_batch(p_child_id uuid, p_session_ids uuid[], p_parent_id uuid, p_child_name text, p_parent_phone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_session_id uuid;
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
        SELECT total_capacity, session_date INTO v_session_capacity, v_session_date
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
        SELECT id, credits_remaining INTO v_package_id, v_credits_remaining
        FROM packages 
        WHERE parent_id = p_parent_id AND credits_remaining > 0
        ORDER BY created_at ASC
        LIMIT 1 
        FOR UPDATE; 

        IF v_package_id IS NULL THEN
            RAISE EXCEPTION 'No active credits available for the full batch.';
        END IF;

        UPDATE packages 
        SET credits_remaining = credits_remaining - 1 
        WHERE id = v_package_id;

        INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
        VALUES (p_parent_id, v_package_id, -1, 'booking', 'Batch Booked session ' || v_session_id);

        -- 4. Create booking
        INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id)
        VALUES (p_child_id, v_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id);
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$function$;


-- 4. Create bulk_close_days RPC
CREATE OR REPLACE FUNCTION public.bulk_close_days(p_start_date date, p_end_date date, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_booking RECORD;
    v_package_id UUID;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can bulk close days';
    END IF;

    -- 1. Insert closure record
    INSERT INTO school_closures (start_date, end_date, reason, created_by)
    VALUES (p_start_date, p_end_date, p_reason, auth.uid());

    -- 2. Find all confirmed bookings in this date range and cancel & refund them
    FOR v_booking IN 
        SELECT id, parent_id, session_id 
        FROM bookings 
        WHERE session_date BETWEEN p_start_date AND p_end_date 
        AND status = 'confirmed'
    LOOP
        -- Cancel booking
        UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;

        -- Find the package to refund to (most recent active package, or just the last used one)
        -- In this simple system, we just add 1 credit to their latest package
        SELECT id INTO v_package_id
        FROM packages
        WHERE parent_id = v_booking.parent_id
        ORDER BY created_at DESC LIMIT 1;

        IF v_package_id IS NOT NULL THEN
            UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = v_package_id;
            
            INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
            VALUES (v_booking.parent_id, v_package_id, 1, 'refund', 'School closed: ' || p_reason);
        END IF;
    END LOOP;

    -- 3. Update sessions in that range to inactive
    UPDATE sessions 
    SET is_active = false, theme = p_reason
    WHERE session_date BETWEEN p_start_date AND p_end_date;

    RETURN jsonb_build_object('success', true);
END;
$function$;
