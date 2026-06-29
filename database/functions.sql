-- ============================================================
-- ICSN Playgroup - Database Functions & RPCs (Auto-generated)
-- Generated on: 2026-06-29T02:22:39.028Z
-- ============================================================

-- Function: admin_book_class
CREATE OR REPLACE FUNCTION public.admin_book_class(p_child_id uuid, p_session_id uuid, p_is_free boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_parent_id UUID;
  v_package_id UUID;
  v_booking_id UUID;
  v_session_date DATE;
BEGIN
  -- หา parent_id
  SELECT parent_id INTO v_parent_id FROM children WHERE id = p_child_id;
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  -- ดึง session_date
  SELECT session_date INTO v_session_date FROM sessions WHERE id = p_session_id;
  IF v_session_date IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- เช็คจองซ้ำ
  IF EXISTS (SELECT 1 FROM bookings WHERE child_id = p_child_id AND session_id = p_session_id AND status = 'confirmed') THEN
    RAISE EXCEPTION 'เด็กคนนี้อยู่ในคลาสนี้แล้ว (Booking already exists)';
  END IF;

  IF p_is_free THEN
    -- ไม่หักเครดิต
    INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
    VALUES (p_session_id, v_session_date, p_child_id, v_parent_id, 'confirmed')
    RETURNING id INTO v_booking_id;
    
    -- เก็บล็อก
    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_free_booking', 0, 'Admin ให้เข้าฟรี session: ' || p_session_id);
  ELSE
    -- หักเครดิต
    SELECT id INTO v_package_id FROM packages WHERE parent_id = v_parent_id AND credits_remaining > 0 ORDER BY created_at ASC LIMIT 1;
    IF v_package_id IS NULL THEN
      RAISE EXCEPTION 'ผู้ปกครองไม่มีสิทธิ์เรียนเหลือแล้ว (No credits remaining)';
    END IF;

    UPDATE packages SET credits_remaining = credits_remaining - 1 WHERE id = v_package_id;
    
    INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
    VALUES (p_session_id, v_session_date, p_child_id, v_parent_id, 'confirmed')
    RETURNING id INTO v_booking_id;
    
    -- เก็บล็อก
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'admin_deduct_booking', -1, 'Admin ตัดสิทธิ์ session: ' || p_session_id);
  END IF;

  RETURN json_build_object('booking_id', v_booking_id);
END;
$function$
;

-- Function: admin_edit_user
CREATE OR REPLACE FUNCTION public.admin_edit_user(p_table text, p_id uuid, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_query TEXT;
  v_key TEXT;
  v_value TEXT;
  v_updates TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_table NOT IN ('parents', 'children') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    v_updates := array_append(v_updates, quote_ident(v_key) || ' = ' || quote_literal(v_value));
  END LOOP;

  IF array_length(v_updates, 1) > 0 THEN
    v_query := 'UPDATE ' || quote_ident(p_table) || ' SET ' || array_to_string(v_updates, ', ') || ' WHERE id = ' || quote_literal(p_id);
    EXECUTE v_query;
  END IF;
END;
$function$
;

-- Function: book_class
CREATE OR REPLACE FUNCTION public.book_class(p_parent_id uuid, p_child_id uuid, p_session_id uuid, p_package_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_credits INT;
  v_capacity INT;
  v_booked INT;
  v_booking_id UUID;
  v_session_date DATE;
BEGIN
  -- 0. ดึงวันที่จาก sessions table
  SELECT session_date INTO v_session_date FROM sessions WHERE id = p_session_id;
  IF v_session_date IS NULL THEN
    RAISE EXCEPTION 'Session not found / ไม่พบข้อมูลคลาส';
  END IF;

  -- 1. ตรวจสอบเครดิต
  SELECT credits_remaining INTO v_credits FROM packages WHERE id = p_package_id AND parent_id = p_parent_id;
  IF v_credits IS NULL OR v_credits <= 0 THEN
    RAISE EXCEPTION 'Not enough credits / สิทธิ์ไม่เพียงพอ';
  END IF;

  -- 2. ตรวจสอบที่ว่าง
  SELECT total_capacity INTO v_capacity FROM sessions WHERE id = p_session_id;
  SELECT count(*) INTO v_booked FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';
  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'Session is full / คลาสเรียนเต็มแล้ว';
  END IF;

  -- 3. ตัดเครดิต
  UPDATE packages SET credits_remaining = credits_remaining - 1 WHERE id = p_package_id;

  -- 4. บันทึกการจอง (รวม session_date ด้วย)
  INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
  VALUES (p_session_id, v_session_date, p_child_id, p_parent_id, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('id', v_booking_id);
END;
$function$
;

-- Function: cancel_booking
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid, p_package_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_status TEXT;
  v_session_id UUID;
  v_session_date DATE;
BEGIN
  -- ดึงข้อมูลการจองและวันที่เรียน
  SELECT b.status, b.session_id, s.session_date 
  INTO v_status, v_session_id, v_session_date
  FROM bookings b
  JOIN sessions s ON b.session_id = s.id
  WHERE b.id = p_booking_id;

  -- 1. Check if already cancelled
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking is already cancelled / คลาสนี้ถูกยกเลิกไปแล้ว';
  END IF;

  -- 2. 07:00 AM Rule (อ้างอิงเวลาประเทศไทย UTC+7)
  IF (timezone('Asia/Bangkok', now())::date >= v_session_date) AND (timezone('Asia/Bangkok', now())::time >= '07:00:00'::time) THEN
    RAISE EXCEPTION 'ไม่สามารถยกเลิกได้ เนื่องจากเลยเวลา 07:00 น. ของวันเรียนแล้ว';
  END IF;

  -- 3. Update booking status
  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  
  -- 4. Refund credit
  UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = p_package_id;
END;
$function$
;

-- Function: admin_add_walkin
CREATE OR REPLACE FUNCTION public.admin_add_walkin(p_phone text, p_child_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_parent_id UUID;
  v_child_id UUID;
  v_dummy_email TEXT;
BEGIN
  SELECT id INTO v_parent_id FROM parents WHERE phone = p_phone LIMIT 1;
  IF v_parent_id IS NULL THEN
    v_parent_id := gen_random_uuid();
    v_dummy_email := 'walkin_' || p_phone || '@icsn.local';
    INSERT INTO parents (id, name, phone, email)
    VALUES (v_parent_id, 'Walk-in Parent (' || p_phone || ')', p_phone, v_dummy_email);
  END IF;

  -- ใส่ค่า default ให้ครบสำหรับฟิลด์ที่บังคับ (ถ้ามี)
  INSERT INTO children (parent_id, full_name, nickname, no_photo_perm, media_perm, age)
  VALUES (v_parent_id, p_child_name, p_child_name, false, true, 0)
  RETURNING id INTO v_child_id;

  RETURN json_build_object('parent_id', v_parent_id, 'child_id', v_child_id);
END;
$function$
;

-- Function: update_session_booked_count
CREATE OR REPLACE FUNCTION public.update_session_booked_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- When a new confirmed booking is inserted
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE sessions SET booked_count = booked_count + 1 WHERE id = NEW.session_id;
    
  -- When a booking's status changes
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE sessions SET booked_count = booked_count + 1 WHERE id = NEW.session_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE sessions SET booked_count = booked_count - 1 WHERE id = OLD.session_id;
    END IF;
    
  -- When a confirmed booking is deleted
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE sessions SET booked_count = booked_count - 1 WHERE id = OLD.session_id;
  END IF;
  
  RETURN NULL;
END;
$function$
;

-- Function: book_class_transactionally
CREATE OR REPLACE FUNCTION public.book_class_transactionally(p_child_id uuid, p_session_id uuid, p_parent_id uuid, p_child_name text, p_parent_phone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_session_capacity INTEGER;
    v_current_booked INTEGER;
    v_package_id UUID;
    v_credits_remaining INTEGER;
    v_booking_exists BOOLEAN;
BEGIN
    -- 1. Check if already booked
    SELECT EXISTS (
        SELECT 1 FROM bookings 
        WHERE child_id = p_child_id AND session_id = p_session_id AND status = 'confirmed'
    ) INTO v_booking_exists;
    
    IF v_booking_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Child is already booked for this session.');
    END IF;

    -- 2. Lock the session row to prevent race conditions
    SELECT total_capacity INTO v_session_capacity
    FROM sessions WHERE id = p_session_id FOR UPDATE;

    IF v_session_capacity IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found.');
    END IF;

    -- 3. Count current bookings
    SELECT COUNT(*) INTO v_current_booked
    FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';

    IF v_current_booked >= v_session_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is fully booked.');
    END IF;

    -- 4. Find active package with credits for this parent
    SELECT id, credits_remaining INTO v_package_id, v_credits_remaining
    FROM packages 
    WHERE parent_id = p_parent_id AND credits_remaining > 0
    ORDER BY created_at ASC
    LIMIT 1 
    FOR UPDATE; -- Lock package row

    IF v_package_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active credits available.');
    END IF;

    -- 5. Deduct credit
    UPDATE packages 
    SET credits_remaining = credits_remaining - 1 
    WHERE id = v_package_id;

    -- 6. Log transaction
    INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
    VALUES (p_parent_id, v_package_id, -1, 'booking', 'Booked session ' || p_session_id);

    -- 7. Insert booking with snapshot data
    INSERT INTO bookings (child_id, session_id, status, child_name_snapshot, parent_phone_snapshot)
    VALUES (p_child_id, p_session_id, 'confirmed', p_child_name, p_parent_phone);

    RETURN jsonb_build_object('success', true);
END;
$function$
;

-- Function: cancel_booking
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid, p_package_id uuid DEFAULT NULL::uuid, p_cancelled_by text DEFAULT 'parent'::text, p_cancel_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_status TEXT;
    v_parent_id UUID;
    v_child_id UUID;
    v_session_date DATE;
    v_pkg_id UUID;
    v_bkk_date DATE;
    v_bkk_hour INT;
    v_child_nickname TEXT;
BEGIN
    SELECT status, parent_id, child_id, session_date
    INTO v_status, v_parent_id, v_child_id, v_session_date
    FROM bookings WHERE id = p_booking_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Booking not found / ไม่พบข้อมูลการจอง';
    END IF;
    IF v_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled / คลาสนี้ถูกยกเลิกไปแล้ว';
    END IF;

    IF p_cancelled_by = 'parent' THEN
        v_bkk_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date;
        v_bkk_hour := EXTRACT(HOUR FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'))::INT;
        IF v_session_date = v_bkk_date AND v_bkk_hour >= 7 THEN
            RAISE EXCEPTION 'เลยเวลา 7:00 แล้ว ติดต่อทีมโดยตรงนะคะ';
        END IF;
    END IF;

    v_pkg_id := p_package_id;
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

    SELECT nickname INTO v_child_nickname FROM children WHERE id = v_child_id;

    RETURN json_build_object(
        'success', true,
        'session_date', v_session_date,
        'child_nickname', v_child_nickname
    );
END;
$function$
;

