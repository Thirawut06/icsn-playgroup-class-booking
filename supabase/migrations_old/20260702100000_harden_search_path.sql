-- Migration: harden_search_path
-- Purpose: Pin search_path on all SECURITY DEFINER functions to prevent
--          search-path injection attacks per Supabase best practices.
-- Ref: https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker

-- 1. get_or_create_sessions_for_date
ALTER FUNCTION public.get_or_create_sessions_for_date(date)
  SET search_path = public;

-- 2. set_date_status
ALTER FUNCTION public.set_date_status(date, date, boolean, text, text)
  SET search_path = public;

-- 3. delete_school_closure
ALTER FUNCTION public.delete_school_closure(uuid)
  SET search_path = public;

-- 4. self_delete_auth_user
ALTER FUNCTION public.self_delete_auth_user()
  SET search_path = public;

-- 5. bulk_reopen_days
ALTER FUNCTION public.bulk_reopen_days(date, date)
  SET search_path = public;

-- 6. admin_process_walkin
ALTER FUNCTION public.admin_process_walkin(text, uuid, text, uuid, text, text)
  SET search_path = public;

-- 7. admin_search_walkin
ALTER FUNCTION public.admin_search_walkin(text)
  SET search_path = public;

-- 8. admin_close_session
ALTER FUNCTION public.admin_close_session(uuid, text)
  SET search_path = public;

-- 9. admin_save_checkin_signature
ALTER FUNCTION public.admin_save_checkin_signature(uuid, text)
  SET search_path = public;

-- 10. book_classes_batch
ALTER FUNCTION public.book_classes_batch(uuid, uuid[], uuid, text, text)
  SET search_path = public;

-- 11. admin_book_class
ALTER FUNCTION public.admin_book_class(uuid, uuid, boolean)
  SET search_path = public;

-- 12. admin_add_walkin
ALTER FUNCTION public.admin_add_walkin(text, text)
  SET search_path = public;

-- 13. admin_edit_user
ALTER FUNCTION public.admin_edit_user(text, uuid, jsonb)
  SET search_path = public;

-- 14. adjust_credits
ALTER FUNCTION public.adjust_credits(uuid, integer, text)
  SET search_path = public;

-- 15. cancel_booking
ALTER FUNCTION public.cancel_booking(uuid, uuid, text, text)
  SET search_path = public;

-- 16. book_class_transactionally
ALTER FUNCTION public.book_class_transactionally(uuid, uuid, uuid, text, text)
  SET search_path = public;

-- 17. book_class
ALTER FUNCTION public.book_class(uuid, uuid, uuid, uuid)
  SET search_path = public;
