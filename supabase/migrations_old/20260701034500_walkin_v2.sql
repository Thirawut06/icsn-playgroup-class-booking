-- Walk-in V2 Migration

-- 1. admin_search_walkin: Searches by phone and returns parent + kids + credits
CREATE OR REPLACE FUNCTION public.admin_search_walkin(p_phone text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

-- 2. admin_process_walkin: Processes everything in a single transaction
CREATE OR REPLACE FUNCTION public.admin_process_walkin(
  p_phone text,
  p_child_id uuid,
  p_child_name text,
  p_session_id uuid,
  p_payment_type text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;
