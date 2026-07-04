


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."adjust_credits"("p_parent_id" "uuid", "p_amount" integer, "p_reason" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."adjust_credits"("p_parent_id" "uuid", "p_amount" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_add_walkin"("p_phone" "text", "p_child_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_parent_id UUID;
  v_child_id UUID;
  v_dummy_email TEXT;
BEGIN
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- 1. Try to find existing parent by phone
  SELECT id INTO v_parent_id FROM parents WHERE phone = p_phone LIMIT 1;
  
  IF v_parent_id IS NULL THEN
    -- Completely new Walk-in Guest
    v_parent_id := gen_random_uuid();
    v_dummy_email := 'walkin_' || p_phone || '@icsn.local';
    INSERT INTO parents (id, name, phone, email)
    VALUES (v_parent_id, 'Walk-in Parent (' || p_phone || ')', p_phone, v_dummy_email);
  ELSE
    -- Parent exists, let's check if the child already exists under this parent
    SELECT id INTO v_child_id FROM children 
    WHERE parent_id = v_parent_id 
      AND (LOWER(TRIM(nickname)) = LOWER(TRIM(p_child_name)) OR LOWER(TRIM(full_name)) = LOWER(TRIM(p_child_name)))
    LIMIT 1;
  END IF;

  -- 2. Create child if not found
  IF v_child_id IS NULL THEN
    INSERT INTO children (parent_id, full_name, nickname, no_photo_perm, media_perm, age)
    VALUES (v_parent_id, p_child_name, p_child_name, false, true, 0)
    RETURNING id INTO v_child_id;
  END IF;

  RETURN json_build_object('parent_id', v_parent_id, 'child_id', v_child_id);
END;
$$;


ALTER FUNCTION "public"."admin_add_walkin"("p_phone" "text", "p_child_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_book_class"("p_child_id" "uuid", "p_session_id" "uuid", "p_is_free" boolean) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_book_class"("p_child_id" "uuid", "p_session_id" "uuid", "p_is_free" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_close_session"("p_session_id" "uuid", "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_booking RECORD;
    v_package_id UUID;
    v_refund_count INT := 0;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can close a session';
    END IF;

    -- 1. Set session to inactive and set the theme to the reason
    UPDATE sessions 
    SET is_active = false, theme = p_reason
    WHERE id = p_session_id;

    -- 2. Find all confirmed bookings in this session, cancel & refund them
    FOR v_booking IN 
        SELECT id, parent_id 
        FROM bookings 
        WHERE session_id = p_session_id 
        AND status = 'confirmed'
    LOOP
        -- Cancel booking
        UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;

        -- Find active package to refund
        SELECT id INTO v_package_id
        FROM packages
        WHERE parent_id = v_booking.parent_id
        ORDER BY created_at DESC LIMIT 1;

        IF v_package_id IS NOT NULL THEN
            UPDATE packages SET credits_remaining = credits_remaining + 1 WHERE id = v_package_id;
            
            INSERT INTO credit_transactions (parent_id, package_id, amount, action_type, notes)
            VALUES (v_booking.parent_id, v_package_id, 1, 'refund', 'Session closed: ' || p_reason);
            
            v_refund_count := v_refund_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'refunded_count', v_refund_count);
END;
$$;


ALTER FUNCTION "public"."admin_close_session"("p_session_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_edit_user"("p_table" "text", "p_id" "uuid", "p_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_edit_user"("p_table" "text", "p_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_parent_id UUID;
  v_dummy_email TEXT;
  v_session_date DATE;
  v_package_id UUID;
  v_booking_id UUID;
  v_real_child_id UUID := p_child_id;
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
    -- Try to find by name just in case (protect against duplicates)
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

  -- Check duplicate booking
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

  ELSIF p_payment_type = 'paid' THEN
    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_adjustment', 0, 'Admin รับชำระรายครั้ง (Walk-in Paid) session: ' || p_session_id);

  ELSIF p_payment_type = 'trial' THEN
    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_free_booking', 0, 'Admin ให้ทดลองเรียนฟรี (Walk-in Trial) session: ' || p_session_id);
    
  ELSE
    RAISE EXCEPTION 'Invalid payment type';
  END IF;

  -- 5. Create Booking
  INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
  VALUES (p_session_id, v_session_date, v_real_child_id, v_parent_id, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id, 'parent_id', v_parent_id, 'child_id', v_real_child_id);
END;
$$;


ALTER FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text") OWNER TO "postgres";


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
    INSERT INTO credit_transactions (parent_id, action_type, amount, notes)
    VALUES (v_parent_id, 'admin_free_booking', 0, 'Admin ให้ทดลองเรียนฟรี (Walk-in Trial) session: ' || p_session_id);
    
  ELSE
    RAISE EXCEPTION 'Invalid payment type';
  END IF;

  -- 5. Create Booking
  INSERT INTO bookings (session_id, session_date, child_id, parent_id, status)
  VALUES (p_session_id, v_session_date, v_real_child_id, v_parent_id, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id, 'parent_id', v_parent_id, 'child_id', v_real_child_id);
END;
$$;


ALTER FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text", "p_package_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_save_checkin_signature"("p_booking_id" "uuid", "p_signature_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  UPDATE public.bookings
  SET
    signature_url = p_signature_url,
    checkin_at    = NOW()
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."admin_save_checkin_signature"("p_booking_id" "uuid", "p_signature_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_search_walkin"("p_phone" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_parent_id UUID;
  v_parent_name TEXT;
  v_credits INT;
  v_children JSON;
BEGIN
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT id, name INTO v_parent_id, v_parent_name FROM parents WHERE phone = p_phone LIMIT 1;
  
  IF v_parent_id IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;

  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_credits FROM packages WHERE parent_id = v_parent_id;
  
  SELECT json_agg(json_build_object('id', id, 'nickname', nickname, 'full_name', full_name))
  INTO v_children
  FROM children WHERE parent_id = v_parent_id;

  RETURN json_build_object(
    'found', true,
    'parent_id', v_parent_id,
    'parent_name', v_parent_name,
    'credits', COALESCE(v_credits, 0),
    'children', COALESCE(v_children, '[]'::json)
  );
END;
$$;


ALTER FUNCTION "public"."admin_search_walkin"("p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_slip"("p_slip_id" "uuid", "p_credits_to_add" integer, "p_notes" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_parent_id UUID;
    v_package_id UUID;
    v_slip_package_id TEXT;
    v_new_credits INTEGER;
    v_child_nickname TEXT;
BEGIN
    -- 1. Admin Auth Check
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- 2. Fetch Slip
    SELECT parent_id, package_id INTO v_parent_id, v_slip_package_id 
    FROM slip_uploads 
    WHERE id = p_slip_id AND status = 'pending';

    IF v_parent_id IS NULL THEN
        RAISE EXCEPTION 'Slip not found or not in pending status';
    END IF;

    -- 3. Update Slip Status
    UPDATE slip_uploads 
    SET status = 'approved', reviewed_at = now() 
    WHERE id = p_slip_id;

    -- 4. Find or Create Package (Prioritize most recent)
    SELECT id INTO v_package_id 
    FROM packages 
    WHERE parent_id = v_parent_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF v_package_id IS NOT NULL THEN
        UPDATE packages 
        SET credits_remaining = credits_remaining + p_credits_to_add 
        WHERE id = v_package_id
        RETURNING credits_remaining INTO v_new_credits;
    ELSE
        INSERT INTO packages (parent_id, type, credits_remaining)
        VALUES (v_parent_id, COALESCE(v_slip_package_id, 'purchase'), p_credits_to_add)
        RETURNING id, credits_remaining INTO v_package_id, v_new_credits;
    END IF;

    -- 5. Record Transaction
    INSERT INTO credit_transactions (parent_id, package_id, action_type, amount, notes)
    VALUES (v_parent_id, v_package_id, 'topup', p_credits_to_add, COALESCE(p_notes, 'slip approved: ' || p_slip_id));

    -- 6. Fetch Child Nickname for notification
    SELECT nickname INTO v_child_nickname
    FROM children
    WHERE parent_id = v_parent_id
    LIMIT 1;

    RETURN json_build_object(
        'success', true, 
        'credits_added', p_credits_to_add,
        'new_total', v_new_credits,
        'child_nickname', COALESCE(v_child_nickname, 'ไม่ระบุ')
    )::jsonb;
END;
$$;


ALTER FUNCTION "public"."approve_slip"("p_slip_id" "uuid", "p_credits_to_add" integer, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_class"("p_parent_id" "uuid", "p_child_id" "uuid", "p_session_id" "uuid", "p_package_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."book_class"("p_parent_id" "uuid", "p_child_id" "uuid", "p_session_id" "uuid", "p_package_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
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

    SELECT EXISTS (
        SELECT 1 FROM bookings 
        WHERE child_id = p_child_id AND session_id = p_session_id AND status = 'confirmed'
    ) INTO v_booking_exists;
    
    IF v_booking_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Child is already booked for this session.');
    END IF;

    SELECT total_capacity, session_date INTO v_session_capacity, v_session_date
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

    INSERT INTO bookings (child_id, session_id, session_date, status, child_name_snapshot, parent_phone_snapshot, parent_id)
    VALUES (p_child_id, p_session_id, v_session_date, 'confirmed', p_child_name, p_parent_phone, p_parent_id);

    RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_reopen_days"("p_start_date" "date", "p_end_date" "date") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can bulk reopen days';
    END IF;

    -- Update sessions in that range to active, BUT skip weekends (0 = Sunday, 6 = Saturday)
    UPDATE sessions 
    SET is_active = true, theme = NULL
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND EXTRACT(DOW FROM session_date) NOT IN (0, 6);
END;
$$;


ALTER FUNCTION "public"."bulk_reopen_days"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


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
$$;


ALTER FUNCTION "public"."cancel_booking"("p_booking_id" "uuid", "p_package_id" "uuid", "p_cancelled_by" "text", "p_cancel_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_school_closure"("p_closure_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."delete_school_closure"("p_closure_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_date" "date" NOT NULL,
    "capacity" integer DEFAULT 12 NOT NULL,
    "booked_count" integer DEFAULT 0 NOT NULL,
    "total_capacity" integer DEFAULT 15,
    "is_active" boolean DEFAULT true,
    "time_label" "text" DEFAULT 'เช้า (09:00 - 12:00)'::"text" NOT NULL,
    "theme" "text",
    "activity_desc" "text"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


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

                INSERT INTO sessions (session_date, time_label, total_capacity, is_active, theme)
                VALUES (p_date, template.time_label, template.capacity, v_is_active_session, v_final_reason)
                ON CONFLICT ON CONSTRAINT sessions_date_time_key DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM sessions WHERE session_date = p_date ORDER BY time_label ASC;
END;
$$;


ALTER FUNCTION "public"."get_or_create_sessions_for_date"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_trial_package"("target_parent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  existing_id UUID;
  existing_credits INT;
BEGIN
  -- Verify the caller is either an admin or the parent themselves
  IF auth.uid() != target_parent_id AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot grant trial for another parent';
  END IF;

  SELECT id, credits_remaining INTO existing_id, existing_credits
  FROM packages
  WHERE parent_id = target_parent_id AND type = 'trial';

  IF existing_id IS NOT NULL THEN
    UPDATE packages
    SET credits_remaining = existing_credits + 1
    WHERE id = existing_id;
  ELSE
    INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
    VALUES (target_parent_id, 'trial', 1, true);
  END IF;
END;
$$;


ALTER FUNCTION "public"."grant_trial_package"("target_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."self_delete_auth_user"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_uid uuid;
    v_has_profile boolean;
BEGIN
    v_uid := auth.uid();
    
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User is not authenticated';
    END IF;

    -- Check if the user already has a parent profile
    SELECT EXISTS (
        SELECT 1 FROM public.parents WHERE id = v_uid
    ) INTO v_has_profile;

    IF v_has_profile THEN
        RAISE EXCEPTION 'Forbidden: Cannot delete user with an active profile';
    END IF;

    -- Safely delete the user from auth.users
    DELETE FROM auth.users WHERE id = v_uid;

    RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."self_delete_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_date_status"("p_start_date" "date", "p_end_date" "date", "p_is_open" boolean, "p_reason" "text" DEFAULT NULL::"text", "p_time_label" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_booking RECORD;
BEGIN
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can manage date status';
    END IF;

    -- 1. Insert closure/override record
    INSERT INTO school_closures (start_date, end_date, reason, time_label, is_force_open, created_by)
    VALUES (p_start_date, p_end_date, COALESCE(p_reason, CASE WHEN p_is_open THEN 'เปิดพิเศษ' ELSE 'ปิดทำการ' END), p_time_label, p_is_open, auth.uid());

    -- 2. Update existing sessions in that range to match the new status
    UPDATE sessions 
    SET is_active = p_is_open, theme = CASE WHEN p_is_open THEN NULL ELSE p_reason END
    WHERE session_date BETWEEN p_start_date AND p_end_date
    AND (p_time_label IS NULL OR time_label = p_time_label);

    -- 3. If closing, find all confirmed bookings and cancel them
    IF NOT p_is_open THEN
        FOR v_booking IN 
            SELECT b.id
            FROM bookings b
            JOIN sessions s ON b.session_id = s.id
            WHERE b.session_date BETWEEN p_start_date AND p_end_date 
            AND b.status = 'confirmed'
            AND (p_time_label IS NULL OR s.time_label = p_time_label)
        LOOP
            -- Cancel booking
            UPDATE bookings SET status = 'cancelled' WHERE id = v_booking.id;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."set_date_status"("p_start_date" "date", "p_end_date" "date", "p_is_open" boolean, "p_reason" "text", "p_time_label" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_drive_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Build the payload containing the new record
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
  );

  -- Use pg_net to invoke the Edge Function asynchronously
  -- IMPORTANT: In production, the host might need to be resolved via an env var or vault,
  -- but for Supabase hosted projects, the Edge Function URL is typically fixed.
  -- Here we assume it's part of the standard setup, so we use a relative-like approach if possible,
  -- but pg_net requires an absolute URL. Since we don't know the exact project ref here securely without vault,
  -- we can just pass the request to a known internal route if available, or instruct the user to use the Dashboard UI.
  
  -- Actually, the recommended way to create webhooks in Supabase is via the Dashboard.
  -- Hardcoding the project URL in SQL is an anti-pattern.
  -- We will just define the trigger function but leave the URL configuration out, OR use the native supabase_functions extension if present.
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_drive_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_sync_files_to_drive"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
  );

  SELECT net.http_post(
    url := 'https://psusuyesaxuhiondxqie.supabase.co/functions/v1/sync-files-to-drive',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_fmVFvVAAys6RtMCsH0ztDA_xWxNAjxh"}'::jsonb,
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_sync_files_to_drive"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_booked_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_session_booked_count"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blockout_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "block_date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blockout_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "child_id" "uuid" NOT NULL,
    "session_date" "date" NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "text",
    "cancel_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "booking_date" timestamp with time zone DEFAULT "now"(),
    "session_id" "uuid",
    "child_name_snapshot" "text",
    "parent_phone_snapshot" "text",
    "signature_url" "text",
    "checkin_at" timestamp with time zone
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."children" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "nickname" "text" NOT NULL,
    "age" integer NOT NULL,
    "food_allergy" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "full_name" "text",
    "dob" "date",
    "media_perm" boolean,
    "no_photo_perm" boolean DEFAULT false,
    "parent_photo_url" "text",
    "special_info" "text",
    "photo_url" "text"
);


ALTER TABLE "public"."children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "package_id" "uuid",
    "action_type" character varying(50) NOT NULL,
    "amount" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "credits" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."package_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "credits_remaining" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "non_refundable" boolean DEFAULT false
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "phone" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "email" "text",
    "admin_notes" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."parents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_closures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "time_label" "text",
    "is_force_open" boolean DEFAULT false,
    CONSTRAINT "valid_date_range" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."school_closures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "time_label" "text" NOT NULL,
    "capacity" integer DEFAULT 12 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."session_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slip_uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "file_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "package_id" "text",
    "non_refundable" boolean DEFAULT false
);


ALTER TABLE "public"."slip_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" character varying(50) NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blockout_dates"
    ADD CONSTRAINT "blockout_dates_block_date_key" UNIQUE ("block_date");



ALTER TABLE ONLY "public"."blockout_dates"
    ADD CONSTRAINT "blockout_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_options"
    ADD CONSTRAINT "package_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parents"
    ADD CONSTRAINT "parents_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."parents"
    ADD CONSTRAINT "parents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_closures"
    ADD CONSTRAINT "school_closures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_date_time_key" UNIQUE ("session_date", "time_label");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slip_uploads"
    ADD CONSTRAINT "slip_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



CREATE INDEX "idx_bookings_child_id" ON "public"."bookings" USING "btree" ("child_id");



CREATE INDEX "idx_bookings_date" ON "public"."bookings" USING "btree" ("session_date");



CREATE INDEX "idx_bookings_parent" ON "public"."bookings" USING "btree" ("parent_id");



CREATE INDEX "idx_bookings_parent_id" ON "public"."bookings" USING "btree" ("parent_id");



CREATE INDEX "idx_bookings_session" ON "public"."bookings" USING "btree" ("session_id");



CREATE INDEX "idx_bookings_session_id" ON "public"."bookings" USING "btree" ("session_id");



CREATE INDEX "idx_children_parent" ON "public"."children" USING "btree" ("parent_id");



CREATE INDEX "idx_children_parent_id" ON "public"."children" USING "btree" ("parent_id");



CREATE INDEX "idx_credit_trans_action" ON "public"."credit_transactions" USING "btree" ("action_type");



CREATE INDEX "idx_credit_trans_parent" ON "public"."credit_transactions" USING "btree" ("parent_id");



CREATE INDEX "idx_credit_transactions_package_id" ON "public"."credit_transactions" USING "btree" ("package_id");



CREATE INDEX "idx_credit_transactions_parent_id" ON "public"."credit_transactions" USING "btree" ("parent_id");



CREATE INDEX "idx_credit_tx_parent" ON "public"."credit_transactions" USING "btree" ("parent_id");



CREATE INDEX "idx_packages_parent" ON "public"."packages" USING "btree" ("parent_id");



CREATE INDEX "idx_packages_parent_id" ON "public"."packages" USING "btree" ("parent_id");



CREATE INDEX "idx_parents_phone" ON "public"."parents" USING "btree" ("phone");



CREATE INDEX "idx_sessions_date" ON "public"."sessions" USING "btree" ("session_date");



CREATE INDEX "idx_slip_uploads_parent_id" ON "public"."slip_uploads" USING "btree" ("parent_id");



CREATE INDEX "idx_slips_parent" ON "public"."slip_uploads" USING "btree" ("parent_id");



CREATE INDEX "idx_slips_status" ON "public"."slip_uploads" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_unique_trial_package" ON "public"."packages" USING "btree" ("parent_id") WHERE ("type" = 'trial'::"text");



CREATE OR REPLACE TRIGGER "on_bookings_sync_drive" AFTER INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_sync_files_to_drive"();



CREATE OR REPLACE TRIGGER "on_children_sync_drive" AFTER INSERT OR UPDATE ON "public"."children" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_sync_files_to_drive"();



CREATE OR REPLACE TRIGGER "on_slip_upload_sync_drive" AFTER INSERT OR UPDATE ON "public"."slip_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_sync_files_to_drive"();



CREATE OR REPLACE TRIGGER "trg_update_session_booked_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_booked_count"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_closures"
    ADD CONSTRAINT "school_closures_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."slip_uploads"
    ADD CONSTRAINT "slip_uploads_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can modify bookings" ON "public"."bookings" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Admin can modify children" ON "public"."children" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Admin can modify package options" ON "public"."package_options" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Admin can modify packages" ON "public"."packages" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Admin can modify parents" ON "public"."parents" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Admin can modify sessions" ON "public"."sessions" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Admin can modify slip uploads" ON "public"."slip_uploads" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Allow admins to manage school_closures" ON "public"."school_closures" TO "authenticated" USING ((COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "Allow anon full access blockout_dates" ON "public"."blockout_dates" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anonymous read blockout_dates" ON "public"."blockout_dates" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anonymous read system_settings" ON "public"."system_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow authenticated full access blockout_dates" ON "public"."blockout_dates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access system_settings" ON "public"."system_settings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access to school_closures" ON "public"."school_closures" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable all access for authenticated admins" ON "public"."session_templates" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for all users" ON "public"."session_templates" FOR DELETE USING (true);



CREATE POLICY "Enable insert access for all users" ON "public"."session_templates" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."session_templates" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."session_templates" FOR UPDATE USING (true);



CREATE POLICY "Parents can view own transactions" ON "public"."credit_transactions" FOR SELECT USING ((("parent_id")::"text" = ("auth"."uid"())::"text"));



CREATE POLICY "Public can read active package options" ON "public"."package_options" FOR SELECT USING ((("is_active" = true) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Public can view sessions" ON "public"."sessions" FOR SELECT USING (true);



CREATE POLICY "Users can insert own children" ON "public"."children" FOR INSERT TO "authenticated" WITH CHECK ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can insert own parent profile" ON "public"."parents" FOR INSERT TO "authenticated" WITH CHECK ((("id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can insert own slip uploads" ON "public"."slip_uploads" FOR INSERT TO "authenticated" WITH CHECK ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can insert own trial package" ON "public"."packages" FOR INSERT TO "authenticated" WITH CHECK ((("parent_id" = "auth"."uid"()) AND ("type" = 'trial'::"text") AND ("credits_remaining" = 1)));



CREATE POLICY "Users can update own children" ON "public"."children" FOR UPDATE TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can update own parent profile" ON "public"."parents" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can update own slip uploads" ON "public"."slip_uploads" FOR UPDATE TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own children" ON "public"."children" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own packages" ON "public"."packages" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own parent profile" ON "public"."parents" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own slip uploads" ON "public"."slip_uploads" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR (COALESCE((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



ALTER TABLE "public"."blockout_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_closures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slip_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."adjust_credits"("p_parent_id" "uuid", "p_amount" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."adjust_credits"("p_parent_id" "uuid", "p_amount" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."adjust_credits"("p_parent_id" "uuid", "p_amount" integer, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_add_walkin"("p_phone" "text", "p_child_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_add_walkin"("p_phone" "text", "p_child_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_add_walkin"("p_phone" "text", "p_child_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_book_class"("p_child_id" "uuid", "p_session_id" "uuid", "p_is_free" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_book_class"("p_child_id" "uuid", "p_session_id" "uuid", "p_is_free" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_book_class"("p_child_id" "uuid", "p_session_id" "uuid", "p_is_free" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_close_session"("p_session_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_close_session"("p_session_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_close_session"("p_session_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_edit_user"("p_table" "text", "p_id" "uuid", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_edit_user"("p_table" "text", "p_id" "uuid", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_edit_user"("p_table" "text", "p_id" "uuid", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text", "p_package_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text", "p_package_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_process_walkin"("p_phone" "text", "p_child_id" "uuid", "p_child_name" "text", "p_session_id" "uuid", "p_payment_type" "text", "p_package_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_save_checkin_signature"("p_booking_id" "uuid", "p_signature_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_save_checkin_signature"("p_booking_id" "uuid", "p_signature_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_save_checkin_signature"("p_booking_id" "uuid", "p_signature_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_search_walkin"("p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_search_walkin"("p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_search_walkin"("p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_slip"("p_slip_id" "uuid", "p_credits_to_add" integer, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_slip"("p_slip_id" "uuid", "p_credits_to_add" integer, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_slip"("p_slip_id" "uuid", "p_credits_to_add" integer, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."book_class"("p_parent_id" "uuid", "p_child_id" "uuid", "p_session_id" "uuid", "p_package_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."book_class"("p_parent_id" "uuid", "p_child_id" "uuid", "p_session_id" "uuid", "p_package_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_class"("p_parent_id" "uuid", "p_child_id" "uuid", "p_session_id" "uuid", "p_package_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_class_transactionally"("p_child_id" "uuid", "p_session_id" "uuid", "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_classes_batch"("p_child_id" "uuid", "p_session_ids" "uuid"[], "p_parent_id" "uuid", "p_child_name" "text", "p_parent_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_reopen_days"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_reopen_days"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_reopen_days"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_booking"("p_booking_id" "uuid", "p_package_id" "uuid", "p_cancelled_by" "text", "p_cancel_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_booking"("p_booking_id" "uuid", "p_package_id" "uuid", "p_cancelled_by" "text", "p_cancel_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_booking"("p_booking_id" "uuid", "p_package_id" "uuid", "p_cancelled_by" "text", "p_cancel_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_school_closure"("p_closure_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_school_closure"("p_closure_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_school_closure"("p_closure_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_sessions_for_date"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_sessions_for_date"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_sessions_for_date"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_trial_package"("target_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_trial_package"("target_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_trial_package"("target_parent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."self_delete_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."self_delete_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."self_delete_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_date_status"("p_start_date" "date", "p_end_date" "date", "p_is_open" boolean, "p_reason" "text", "p_time_label" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_date_status"("p_start_date" "date", "p_end_date" "date", "p_is_open" boolean, "p_reason" "text", "p_time_label" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_date_status"("p_start_date" "date", "p_end_date" "date", "p_is_open" boolean, "p_reason" "text", "p_time_label" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_drive_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_drive_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_drive_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_sync_files_to_drive"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_sync_files_to_drive"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_sync_files_to_drive"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_booked_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_booked_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_booked_count"() TO "service_role";


















GRANT ALL ON TABLE "public"."blockout_dates" TO "anon";
GRANT ALL ON TABLE "public"."blockout_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."blockout_dates" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."children" TO "anon";
GRANT ALL ON TABLE "public"."children" TO "authenticated";
GRANT ALL ON TABLE "public"."children" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."package_options" TO "anon";
GRANT ALL ON TABLE "public"."package_options" TO "authenticated";
GRANT ALL ON TABLE "public"."package_options" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."parents" TO "anon";
GRANT ALL ON TABLE "public"."parents" TO "authenticated";
GRANT ALL ON TABLE "public"."parents" TO "service_role";



GRANT ALL ON TABLE "public"."school_closures" TO "anon";
GRANT ALL ON TABLE "public"."school_closures" TO "authenticated";
GRANT ALL ON TABLE "public"."school_closures" TO "service_role";



GRANT ALL ON TABLE "public"."session_templates" TO "anon";
GRANT ALL ON TABLE "public"."session_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."session_templates" TO "service_role";



GRANT ALL ON TABLE "public"."slip_uploads" TO "anon";
GRANT ALL ON TABLE "public"."slip_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."slip_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































