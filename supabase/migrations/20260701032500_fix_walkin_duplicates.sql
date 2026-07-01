-- Fix admin_add_walkin to prevent duplicate children for existing parents

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
$function$
;
