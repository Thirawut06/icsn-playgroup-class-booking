-- Migration to add SECURITY DEFINER RPC returning list of affected confirmed bookings for admin closure warning modal
CREATE OR REPLACE FUNCTION public.get_affected_bookings_list(p_dates date[])
RETURNS TABLE (
  id uuid,
  session_date date,
  child_nickname text,
  parent_name text,
  parent_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.session_date,
    COALESCE(c.nickname, b.child_name_snapshot, 'ไม่ระบุ')::text AS child_nickname,
    COALESCE(p.name, 'ผู้ปกครอง')::text AS parent_name,
    COALESCE(p.phone, b.parent_phone_snapshot, '-')::text AS parent_phone
  FROM public.bookings b
  LEFT JOIN public.children c ON b.child_id = c.id
  LEFT JOIN public.parents p ON b.parent_id = p.id
  WHERE b.session_date = ANY(p_dates)
    AND b.status = 'confirmed'
  ORDER BY b.session_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affected_bookings_list(date[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affected_bookings_list(date[]) TO service_role;
