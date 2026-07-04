-- Function to get or create sessions for a specific date
CREATE OR REPLACE FUNCTION public.get_or_create_sessions_for_date(p_date date)
 RETURNS SETOF sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_locked_labels text[];
    v_has_templates boolean;
BEGIN
    -- 1. Delete empty sessions for this date (where no one has booked)
    DELETE FROM sessions 
    WHERE session_date = p_date AND (booked_count IS NULL OR booked_count = 0);

    -- 2. Get array of time_labels for locked sessions (where someone has booked)
    SELECT array_agg(time_label) INTO v_locked_labels 
    FROM sessions 
    WHERE session_date = p_date AND booked_count > 0;

    -- 3. Check if any templates exist
    SELECT EXISTS (SELECT 1 FROM session_templates) INTO v_has_templates;

    IF NOT v_has_templates THEN
        -- If no templates exist and no locked sessions, insert a default fallback session
        IF v_locked_labels IS NULL THEN
            INSERT INTO sessions (session_date, time_label, total_capacity, is_active)
            VALUES (p_date, '9.00 - 10.30', 12, true);
        END IF;
    ELSE
        -- Insert new sessions from ALL templates (active or inactive), skipping locked time_labels
        INSERT INTO sessions (session_date, time_label, total_capacity, is_active)
        SELECT p_date, time_label, capacity, is_active
        FROM session_templates
        WHERE (v_locked_labels IS NULL OR time_label != ALL(v_locked_labels));
    END IF;

    -- 4. Return all sessions for the date (both newly created and existing locked ones)
    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label;
END;
$function$
;
