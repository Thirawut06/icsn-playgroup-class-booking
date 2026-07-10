-- 1. Add trial_capacity columns
ALTER TABLE public.session_templates ADD COLUMN trial_capacity integer DEFAULT 2 NOT NULL;
ALTER TABLE public.sessions ADD COLUMN trial_capacity integer DEFAULT 2 NOT NULL;
ALTER TABLE public.bookings ADD COLUMN is_trial boolean DEFAULT false NOT NULL;

-- 2. Update get_or_create_sessions_for_date
CREATE OR REPLACE FUNCTION "public"."get_or_create_sessions_for_date"("p_date" "date") RETURNS SETOF "public"."sessions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_locked_labels text[];
    v_has_templates boolean;
    v_full_day_closure_reason text;
    v_is_force_open boolean;
    v_final_reason text;
    v_operating_days_str text;
    v_is_operating_day boolean;
    v_is_active_session boolean;
    template RECORD;
BEGIN
    -- Check if date falls in a full-day closure or force open
    SELECT reason, is_force_open INTO v_full_day_closure_reason, v_is_force_open
    FROM school_closures 
    WHERE p_date BETWEEN start_date AND end_date AND time_label IS NULL
    ORDER BY is_force_open DESC -- prioritize force open if overlaps exist
    LIMIT 1;

    -- Fetch operating days
    SELECT value INTO v_operating_days_str FROM system_settings WHERE key = 'operating_days';
    IF v_operating_days_str IS NULL THEN
        v_operating_days_str := '[0,1,2,3,4,5,6]';
    END IF;

    -- Check if day of week is an operating day
    SELECT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(v_operating_days_str::jsonb) AS dow
        WHERE dow::int = EXTRACT(DOW FROM p_date)::int
    ) INTO v_is_operating_day;

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
                
                -- Determine session-specific status
                v_final_reason := v_full_day_closure_reason;
                v_is_active_session := true;

                -- Priority 1: Check for session-specific closure (time_label matches)
                IF v_final_reason IS NULL THEN
                    SELECT reason INTO v_final_reason
                    FROM school_closures
                    WHERE p_date BETWEEN start_date AND end_date AND time_label = template.time_label
                    LIMIT 1;
                END IF;

                -- Logic for active state
                IF v_is_force_open = true THEN
                    v_is_active_session := true;
                    v_final_reason := NULL; -- clear reason since it's force opened
                ELSIF v_final_reason IS NOT NULL THEN
                    v_is_active_session := false;
                ELSIF v_is_operating_day = false THEN
                    v_is_active_session := false;
                    v_final_reason := 'นอกเวลาทำการ';
                ELSE
                    v_is_active_session := true;
                END IF;

                -- Final check with template's own active state
                IF NOT template.is_active THEN
                    v_is_active_session := false;
                END IF;

                INSERT INTO sessions (session_date, time_label, total_capacity, trial_capacity, is_active, theme)
                VALUES (p_date, template.time_label, template.capacity, template.trial_capacity, v_is_active_session, v_final_reason)
                ON CONFLICT ON CONSTRAINT sessions_date_time_key DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label ASC;
END;
$$;


-- 3. Update book_class_transactionally
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

    INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id, is_trial)
    VALUES (p_child_id, p_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id, v_package_type = 'trial');

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 4. Update book_classes_batch
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

        -- 4. Create booking
        INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id, is_trial)
        VALUES (p_child_id, v_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id, v_package_type = 'trial');

    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 5. Update admin_process_walkin
CREATE OR REPLACE FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text", "p_package_name" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_parent_id UUID;
  v_dummy_email TEXT;
  v_session_date DATE;
  v_package_id UUID;
  v_booking_id UUID;
  v_real_child_id UUID := p_child_id;
  v_pkg_credits INT;
  v_pkg_price NUMERIC;
  v_is_trial BOOLEAN := false;
  v_session_trial_capacity INTEGER;
  v_current_trial_booked INTEGER;
BEGIN
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- 1. Find or create parent
  SELECT id INTO v_parent_id FROM parents WHERE phone = p_phone LIMIT 1;
  IF v_parent_id IS NULL THEN
    v_parent_id := gen_random_uuid();
    v_dummy_email := 'walkin_' || p_phone || '@icsn.local';
    INSERT INTO parents (id, name, phone, email)
    VALUES (v_parent_id, 'Walk-in (' || p_phone || ')', p_phone, v_dummy_email);
  END IF;

  -- 2. Find or create child
  IF v_real_child_id IS NULL THEN
    SELECT id INTO v_real_child_id FROM children 
    WHERE parent_id = v_parent_id 
      AND (LOWER(TRIM(nickname)) = LOWER(TRIM(p_child_name)) OR LOWER(TRIM(full_name)) = LOWER(TRIM(p_child_name)))
    LIMIT 1;

    IF v_real_child_id IS NULL THEN
      INSERT INTO children (parent_id, full_name, nickname, no_photo_perm, media_perm, age)
      VALUES (v_parent_id, p_child_name, p_child_name, false, true, 0)
      RETURNING id INTO v_real_child_id;
    END IF;
  END IF;

  -- 3. Verify session
  SELECT session_date INTO v_session_date FROM sessions WHERE id = p_session_id;
  IF v_session_date IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF EXISTS (SELECT 1 FROM bookings WHERE child_id = v_real_child_id AND session_id = p_session_id AND status = 'confirmed') THEN
    RAISE EXCEPTION 'เด็กคนนี้เช็คอินในคลาสนี้ไปแล้ว (Already checked in)';
  END IF;

  -- 4. Process Payment & Book
  IF p_payment_type = 'deduct' THEN
    SELECT id INTO v_package_id FROM packages WHERE parent_id = v_parent_id AND credits_remaining > 0 ORDER BY created_at ASC LIMIT 1;
    IF v_package_id IS NULL THEN
      RAISE EXCEPTION 'ไม่มีเครดิตคงเหลือ ไม่สามารถหักสิทธิ์ได้ (No credits remaining)';
    END IF;
    
    UPDATE packages SET credits_remaining = credits_remaining - 1 WHERE id = v_package_id;
    
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'admin_deduct_booking', -1, 'Admin ตัดสิทธิ์ (Walk-in) session: ' || p_session_id);

  ELSIF p_payment_type = 'paid_package' THEN
    IF p_package_name IS NULL THEN
      RAISE EXCEPTION 'Package name must be provided for paid_package payment type';
    END IF;
    
    SELECT credits, price INTO v_pkg_credits, v_pkg_price FROM package_options WHERE name = p_package_name LIMIT 1;
    IF v_pkg_credits IS NULL THEN
      RAISE EXCEPTION 'Package option not found: %', p_package_name;
    END IF;

    -- Create package and deduct 1 credit immediately
    INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
    VALUES (v_parent_id, p_package_name, v_pkg_credits - 1, false)
    RETURNING id INTO v_package_id;

    -- Log Topup transaction
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'admin_adjustment', v_pkg_credits, 'Admin รับชำระแพ็คเกจหน้างาน: ' || p_package_name);
    
    -- Log Deduction transaction
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'admin_deduct_booking', -1, 'Admin ตัดสิทธิ์ (Walk-in Paid Package) session: ' || p_session_id);

    -- Create Pending Slip Upload
    INSERT INTO slip_uploads (parent_id, file_url, status, package_id)
    VALUES (v_parent_id, 'PENDING_WALKIN_PAYMENT', 'pending', p_package_name);

  ELSIF p_payment_type = 'paid' THEN
    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_adjustment', 0, 'Admin รับชำระรายครั้ง (Walk-in Paid) session: ' || p_session_id);

  ELSIF p_payment_type = 'trial' THEN
    v_is_trial := true;
    
    SELECT trial_capacity INTO v_session_trial_capacity FROM sessions WHERE id = p_session_id;
    SELECT COUNT(*) INTO v_current_trial_booked FROM bookings WHERE session_id = p_session_id AND status = 'confirmed' AND is_trial = true;
    
    IF v_current_trial_booked >= v_session_trial_capacity THEN
        RAISE EXCEPTION 'Trial slots for this session are fully booked. (โควต้าทดลองเรียนเต็มแล้ว)';
    END IF;

    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_free_booking', 0, 'Admin ให้ทดลองเรียนฟรี (Walk-in Trial) session: ' || p_session_id);
    
  ELSE
    RAISE EXCEPTION 'Invalid payment type';
  END IF;

  -- 5. Create Booking
  INSERT INTO bookings (session_id, session_date, child_id, parent_id, status, is_trial)
  VALUES (p_session_id, v_session_date, v_real_child_id, v_parent_id, 'confirmed', v_is_trial)
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id, 'parent_id', v_parent_id, 'child_id', v_real_child_id);
END;
$$;
