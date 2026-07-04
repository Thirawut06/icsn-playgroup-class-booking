-- Create a highly secure RPC for cleaning up an auth user during a failed signup.
-- This function can ONLY delete the currently authenticated user, AND ONLY IF they do not have a completed parent profile.

CREATE OR REPLACE FUNCTION public.self_delete_auth_user()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER -- Needs elevated privileges to delete from auth.users
 SET search_path = public
AS $function$
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
$function$;
