-- 1. Add required tables to supabase_realtime publication for UI sync
ALTER PUBLICATION supabase_realtime ADD TABLE school_closures;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;

-- 2. Create the Zero Trust validation function for bookings
CREATE OR REPLACE FUNCTION public.validate_booking_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_session_is_active BOOLEAN;
    v_session_date DATE;
    v_cutoff_hour_str TEXT;
    v_cutoff_hour INTEGER;
    v_current_th_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Check if user is admin (Admin bypasses these rules)
    v_is_admin := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
    IF v_is_admin THEN
        RETURN NEW;
    END IF;

    -- 2. Fetch session details
    SELECT is_active, session_date INTO v_session_is_active, v_session_date
    FROM sessions 
    WHERE id = NEW.session_id;

    IF v_session_is_active IS NULL THEN
        RAISE EXCEPTION 'Session not found.';
    END IF;

    -- 3. Rule: Session MUST be active
    IF v_session_is_active = false THEN
        RAISE EXCEPTION 'Session is currently closed or inactive. (คลาสนี้ถูกปิดไปแล้ว)';
    END IF;

    -- 4. Rule: Cut-off time validation (Only applies if booking for TODAY)
    -- We use AT TIME ZONE 'Asia/Bangkok' to ensure correct time comparison
    v_current_th_time := CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok';
    
    IF v_session_date = (v_current_th_time::DATE) THEN
        -- Fetch cutoff hour from system_settings
        SELECT value INTO v_cutoff_hour_str FROM system_settings WHERE key = 'cutoff_hour';
        v_cutoff_hour := COALESCE(v_cutoff_hour_str::INTEGER, 7); -- Default to 07:00 if not found
        
        IF EXTRACT(HOUR FROM v_current_th_time) >= v_cutoff_hour THEN
            RAISE EXCEPTION 'Cannot book today''s class after %:00. (เลยเวลาจองสำหรับคลาสวันนี้แล้ว)', LPAD(v_cutoff_hour::TEXT, 2, '0');
        END IF;
    END IF;

    -- 5. Rule: Cannot book for past dates
    IF v_session_date < (v_current_th_time::DATE) THEN
        RAISE EXCEPTION 'Cannot book a class in the past. (ไม่สามารถจองคลาสย้อนหลังได้)';
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Attach the trigger to bookings table
DROP TRIGGER IF EXISTS trg_validate_booking_rules ON public.bookings;
CREATE TRIGGER trg_validate_booking_rules
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_booking_rules();
