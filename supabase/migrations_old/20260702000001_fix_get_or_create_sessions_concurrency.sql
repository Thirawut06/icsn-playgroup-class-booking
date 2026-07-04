-- Migration: 20260702000001_fix_get_or_create_sessions_concurrency
-- Purpose: Fix concurrency issue in get_or_create_sessions_for_date that causes duplicate key value violates unique constraint "sessions_date_time_key"

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

                -- Use ON CONFLICT DO NOTHING to prevent concurrency errors when multiple requests attempt to create the same session
                INSERT INTO sessions (session_date, time_label, total_capacity, is_active, theme)
                VALUES (p_date, template.time_label, template.capacity, (v_final_reason IS NULL AND template.is_active), v_final_reason)
                ON CONFLICT ON CONSTRAINT sessions_date_time_key DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label ASC;
END;
$function$;
