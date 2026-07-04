-- Harden Auth, RLS, and RPCs against unauthenticated and unauthorized access

-- ==========================================
-- 1. HARDEN RPC FUNCTIONS
-- ==========================================

-- admin_book_class
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
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT parent_id INTO v_parent_id FROM children WHERE id = p_child_id;
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  SELECT session_date INTO v_session_date FROM sessions WHERE id = p_session_id;
  IF v_session_date IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF EXISTS (SELECT 1 FROM bookings WHERE child_id = p_child_id AND session_id = p_session_id AND status = 'confirmed') THEN
    RAISE EXCEPTION 'เด็กคนนี้อยู่ในคลาสนี้แล้ว (Booking already exists)';
  END IF;

  IF p_is_free THEN
    INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
    VALUES (p_session_id, v_session_date, p_child_id, v_parent_id, 'confirmed')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_free_booking', 0, 'Admin ให้เข้าฟรี session: ' || p_session_id);
  ELSE
    SELECT id INTO v_package_id FROM packages WHERE parent_id = v_parent_id AND credits_remaining > 0 ORDER BY created_at ASC LIMIT 1;
    IF v_package_id IS NULL THEN
      RAISE EXCEPTION 'ผู้ปกครองไม่มีสิทธิ์เรียนเหลือแล้ว (No credits remaining)';
    END IF;

    UPDATE packages SET credits_remaining = credits_remaining - 1 WHERE id = v_package_id;
    
    INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
    VALUES (p_session_id, v_session_date, p_child_id, v_parent_id, 'confirmed')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'admin_deduct_booking', -1, 'Admin ตัดสิทธิ์ session: ' || p_session_id);
  END IF;

  RETURN json_build_object('booking_id', v_booking_id);
END;
$function$
;

-- admin_add_walkin
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
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT id INTO v_parent_id FROM parents WHERE phone = p_phone LIMIT 1;
  IF v_parent_id IS NULL THEN
    v_parent_id := gen_random_uuid();
    v_dummy_email := 'walkin_' || p_phone || '@icsn.local';
    INSERT INTO parents (id, name, phone, email)
    VALUES (v_parent_id, 'Walk-in Parent (' || p_phone || ')', p_phone, v_dummy_email);
  END IF;

  INSERT INTO children (parent_id, full_name, nickname, no_photo_perm, media_perm, age)
  VALUES (v_parent_id, p_child_name, p_child_name, false, true, 0)
  RETURNING id INTO v_child_id;

  RETURN json_build_object('parent_id', v_parent_id, 'child_id', v_child_id);
END;
$function$
;

-- admin_edit_user (Adding admin check on top of previous fix)
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
  v_allowed_parents TEXT[] := ARRAY['name', 'phone', 'email', 'line_id'];
  v_allowed_children TEXT[] := ARRAY['full_name', 'nickname', 'dob', 'age', 'food_allergy', 'special_info', 'media_perm', 'no_photo_perm'];
BEGIN
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF p_table NOT IN ('parents', 'children') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    IF p_table = 'parents' AND v_key = ANY(v_allowed_parents) THEN
      v_updates := array_append(v_updates, quote_ident(v_key) || ' = ' || quote_literal(v_value));
    ELSIF p_table = 'children' AND v_key = ANY(v_allowed_children) THEN
      v_updates := array_append(v_updates, quote_ident(v_key) || ' = ' || quote_literal(v_value));
    ELSE
      RAISE EXCEPTION 'Disallowed or unknown column update attempted: %', v_key;
    END IF;
  END LOOP;

  IF array_length(v_updates, 1) > 0 THEN
    v_query := 'UPDATE ' || quote_ident(p_table) || ' SET ' || array_to_string(v_updates, ', ') || ' WHERE id = ' || quote_literal(p_id);
    EXECUTE v_query;
  END IF;
END;
$function$
;

-- adjust_credits (Adding admin check)
CREATE OR REPLACE FUNCTION public.adjust_credits(p_parent_id uuid, p_amount integer, p_reason text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_package_id UUID;
    v_new_credits INTEGER;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    IF p_amount > 100 OR p_amount < -100 THEN
        RAISE EXCEPTION 'Credit adjustment out of bounds';
    END IF;

    IF p_amount = 0 THEN
        SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
        RETURN COALESCE(v_new_credits, 0);
    END IF;

    IF p_amount > 0 THEN
        INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
        VALUES (p_parent_id, 'manual_adjustment', p_amount, true)
        RETURNING id INTO v_package_id;

        INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
        VALUES (p_parent_id, v_package_id, 'admin_adjust', p_amount, COALESCE(p_reason, 'Admin adjustment'));
    ELSE
        RAISE EXCEPTION 'Negative credit adjustments must be handled via specific package refunds or deduction flows.';
    END IF;

    SELECT SUM(credits_remaining) INTO v_new_credits FROM packages WHERE parent_id = p_parent_id AND credits_remaining > 0;
    RETURN COALESCE(v_new_credits, 0);
END;
$function$
;

-- cancel_booking (Adding auth check)
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
    v_caller_uid UUID;
    v_is_admin BOOLEAN;
BEGIN
    v_caller_uid := auth.uid();
    v_is_admin := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';

    SELECT status, parent_id, child_id, session_date
    INTO v_status, v_parent_id, v_child_id, v_session_date
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

-- book_class_transactionally (Adding auth check)
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

    SELECT total_capacity INTO v_session_capacity
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

    INSERT INTO bookings (child_id, session_id, status, child_name_snapshot, parent_phone_snapshot, parent_id)
    VALUES (p_child_id, p_session_id, 'confirmed', p_child_name, p_parent_phone, p_parent_id);

    RETURN jsonb_build_object('success', true);
END;
$function$
;

-- book_class (Adding auth check)
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
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
  IF NOT v_is_admin AND p_parent_id != auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: Cannot book for another parent';
  END IF;

  SELECT session_date INTO v_session_date FROM sessions WHERE id = p_session_id;
  IF v_session_date IS NULL THEN
    RAISE EXCEPTION 'Session not found / ไม่พบข้อมูลคลาส';
  END IF;

  SELECT credits_remaining INTO v_credits FROM packages WHERE id = p_package_id AND parent_id = p_parent_id;
  IF v_credits IS NULL OR v_credits <= 0 THEN
    RAISE EXCEPTION 'Not enough credits / สิทธิ์ไม่เพียงพอ';
  END IF;

  SELECT total_capacity INTO v_capacity FROM sessions WHERE id = p_session_id;
  SELECT count(*) INTO v_booked FROM bookings WHERE session_id = p_session_id AND status = 'confirmed';
  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'Session is full / คลาสเรียนเต็มแล้ว';
  END IF;

  UPDATE packages SET credits_remaining = credits_remaining - 1 WHERE id = p_package_id;

  INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
  VALUES (p_session_id, v_session_date, p_child_id, p_parent_id, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('id', v_booking_id);
END;
$function$
;


-- ==========================================
-- 2. HARDEN RLS POLICIES
-- ==========================================

-- Drop all excessively permissive policies
DROP POLICY IF EXISTS "Allow public insert slip_uploads" ON public.slip_uploads;
DROP POLICY IF EXISTS "Allow public select slip_uploads" ON public.slip_uploads;
DROP POLICY IF EXISTS "Allow public update slip_uploads" ON public.slip_uploads;
DROP POLICY IF EXISTS "Allow admin modify sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow public select sessions" ON public.sessions;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Allow anon insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public insert parents" ON public.parents;
DROP POLICY IF EXISTS "Allow public select parents" ON public.parents;
DROP POLICY IF EXISTS "Allow public update parents" ON public.parents;
DROP POLICY IF EXISTS "Allow public insert packages" ON public.packages;
DROP POLICY IF EXISTS "Allow public select packages" ON public.packages;
DROP POLICY IF EXISTS "Allow public update packages" ON public.packages;
DROP POLICY IF EXISTS "Allow public insert children" ON public.children;
DROP POLICY IF EXISTS "Allow public select children" ON public.children;
DROP POLICY IF EXISTS "Allow public update children" ON public.children;
DROP POLICY IF EXISTS "Allow admin all access to packages" ON public.package_options;
DROP POLICY IF EXISTS "Allow public read access to active packages" ON public.package_options;

-- Sessions
CREATE POLICY "Public can view sessions" ON public.sessions FOR SELECT TO public USING (true);
CREATE POLICY "Admin can modify sessions" ON public.sessions FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Admin can modify bookings" ON public.bookings FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Parents
CREATE POLICY "Users can view own parent profile" ON public.parents FOR SELECT TO authenticated USING (id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Users can update own parent profile" ON public.parents FOR UPDATE TO authenticated USING (id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Users can insert own parent profile" ON public.parents FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Admin can modify parents" ON public.parents FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Children
CREATE POLICY "Users can view own children" ON public.children FOR SELECT TO authenticated USING (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Users can insert own children" ON public.children FOR INSERT TO authenticated WITH CHECK (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Users can update own children" ON public.children FOR UPDATE TO authenticated USING (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Admin can modify children" ON public.children FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Packages
CREATE POLICY "Users can view own packages" ON public.packages FOR SELECT TO authenticated USING (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Admin can modify packages" ON public.packages FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Package Options
CREATE POLICY "Public can read active package options" ON public.package_options FOR SELECT TO public USING (is_active = true OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Admin can modify package options" ON public.package_options FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Slip Uploads
CREATE POLICY "Users can view own slip uploads" ON public.slip_uploads FOR SELECT TO authenticated USING (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Users can insert own slip uploads" ON public.slip_uploads FOR INSERT TO authenticated WITH CHECK (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Users can update own slip uploads" ON public.slip_uploads FOR UPDATE TO authenticated USING (parent_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
CREATE POLICY "Admin can modify slip uploads" ON public.slip_uploads FOR ALL TO authenticated USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
