CREATE OR REPLACE FUNCTION "public"."admin_edit_user"("p_table" "text", "p_id" "uuid", "p_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_query TEXT;
  v_key TEXT;
  v_value TEXT;
  v_updates TEXT[] := ARRAY[]::TEXT[];
  v_allowed_parents TEXT[] := ARRAY['name', 'phone', 'email', 'line_id', 'admin_notes'];
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
