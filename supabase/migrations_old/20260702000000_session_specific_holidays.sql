-- Migration: 20260702000000_session_specific_holidays
-- Purpose: Add session-specific closures (holidays) granularity

-- 1. Add time_label to school_closures
ALTER TABLE public.school_closures ADD COLUMN IF NOT EXISTS time_label text NULL;

-- 2. Modify get_or_create_sessions_for_date to handle time_label closures
CREATE OR REPLACE FUNCTION public.get_or_create_sessions_for_date(p_date date)
 RETURNS SETOF sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_locked_labels text[];
    v_has_templates boolean;
    v_full_day_closure_reason text;
    v_final_reason text;
    template RECORD;
BEGIN
    -- Check if date falls in a full-day closure
    SELECT reason INTO v_full_day_closure_reason 
    FROM school_closures 
    WHERE p_date BETWEEN start_date AND end_date AND time_label IS NULL
    LIMIT 1;

    -- Delete empty sessions for this date (where no one has booked)
    DELETE FROM sessions 
    WHERE session_date = p_date AND (booked_count IS NULL OR booked_count = 0);

    -- Get array of time_labels for locked sessions (where someone has booked)
    SELECT array_agg(time_label) INTO v_locked_labels 
    FROM sessions 
    WHERE session_date = p_date AND booked_count > 0;

    -- Check if there are active templates
    SELECT EXISTS (SELECT 1 FROM session_templates WHERE is_active = true) INTO v_has_templates;
    
    IF v_has_templates THEN
        FOR template IN SELECT * FROM session_templates WHERE is_active = true ORDER BY time_label ASC
        LOOP
            -- Only insert if it doesn't already exist in locked sessions
            IF v_locked_labels IS NULL OR NOT (template.time_label = ANY(v_locked_labels)) THEN
                -- Check for session-specific closure if not full day
                v_final_reason := v_full_day_closure_reason;
                IF v_final_reason IS NULL THEN
                    SELECT reason INTO v_final_reason
                    FROM school_closures
                    WHERE p_date BETWEEN start_date AND end_date AND time_label = template.time_label
                    LIMIT 1;
                END IF;

                INSERT INTO sessions (session_date, time_label, total_capacity, is_active, theme)
                VALUES (p_date, template.time_label, template.capacity, (v_final_reason IS NULL AND template.is_active), v_final_reason);
            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label ASC;
END;
$function$;

-- 3. Replace bulk_close_days
DROP FUNCTION IF EXISTS public.bulk_close_days(date, date, text);

CREATE OR REPLACE FUNCTION public.bulk_close_days(p_start_date date, p_end_date date, p_reason text, p_time_label text DEFAULT NULL)
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
    INSERT INTO school_closures (start_date, end_date, reason, time_label, created_by)
    VALUES (p_start_date, p_end_date, p_reason, p_time_label, auth.uid());

    -- 2. Update existing sessions in that range to inactive, BUT skip weekends
    UPDATE sessions 
    SET is_active = false, theme = p_reason
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND (p_time_label IS NULL OR time_label = p_time_label)
    AND EXTRACT(DOW FROM session_date) NOT IN (0, 6);

    -- 3. Find all confirmed bookings in this date range (and session if specified) and cancel & refund them
    FOR v_booking IN 
        SELECT b.id, b.parent_id 
        FROM bookings b
        JOIN sessions s ON b.session_id = s.id
        WHERE b.session_date BETWEEN p_start_date AND p_end_date 
        AND b.status = 'confirmed'
        AND (p_time_label IS NULL OR s.time_label = p_time_label)
    LOOP
        -- Cancel booking
        UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;

        -- Find the package to refund to
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

    RETURN jsonb_build_object('success', true);
END;
$function$;

-- 4. Create new delete_school_closure RPC to safely re-open sessions
CREATE OR REPLACE FUNCTION public.delete_school_closure(p_closure_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_start date;
    v_end date;
    v_time_label text;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage holidays';
    END IF;

    -- 1. Read closure info
    SELECT start_date, end_date, time_label INTO v_start, v_end, v_time_label 
    FROM school_closures WHERE id = p_closure_id;

    IF v_start IS NULL THEN
        RAISE EXCEPTION 'Closure not found';
    END IF;

    -- 2. Delete it
    DELETE FROM school_closures WHERE id = p_closure_id;

    -- 3. Re-evaluate all sessions in that date range (skipping weekends)
    -- Set them to active=true and theme=NULL IF no other closure applies to them
    UPDATE sessions s
    SET is_active = true, theme = NULL
    WHERE s.session_date BETWEEN v_start AND v_end
    AND EXTRACT(DOW FROM s.session_date) NOT IN (0, 6)
    AND NOT EXISTS (
        SELECT 1 FROM school_closures c
        WHERE s.session_date BETWEEN c.start_date AND c.end_date
        AND (c.time_label IS NULL OR c.time_label = s.time_label)
    );

    RETURN jsonb_build_object('success', true);
END;
$function$;
