-- Create an RPC function to securely grant a trial package (or increment if exists)
-- This runs with elevated privileges (SECURITY DEFINER) but includes authorization checks.

CREATE OR REPLACE FUNCTION grant_trial_package(target_parent_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- Only allow admins to increment existing trial packages. 
    -- If a normal user calls this and they already have a trial, do nothing (idempotent).
    IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' THEN
      UPDATE packages
      SET credits_remaining = existing_credits + 1
      WHERE id = existing_id;
    END IF;
  ELSE
    -- If they don't have one, grant the initial 1 credit trial
    INSERT INTO packages (parent_id, type, credits_remaining, non_refundable)
    VALUES (target_parent_id, 'trial', 1, true);
  END IF;
END;
$$;
