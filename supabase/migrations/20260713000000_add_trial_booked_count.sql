-- 1. Add trial_booked_count column to sessions
ALTER TABLE public.sessions ADD COLUMN trial_booked_count integer DEFAULT 0 NOT NULL;

-- 2. Update the trigger function to maintain both booked_count and trial_booked_count
CREATE OR REPLACE FUNCTION "public"."update_session_booked_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- When a new confirmed booking is inserted
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE sessions 
    SET booked_count = booked_count + 1,
        trial_booked_count = trial_booked_count + CASE WHEN NEW.is_trial THEN 1 ELSE 0 END
    WHERE id = NEW.session_id;
    
  -- When a booking's status changes
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE sessions 
      SET booked_count = booked_count + 1,
          trial_booked_count = trial_booked_count + CASE WHEN NEW.is_trial THEN 1 ELSE 0 END
      WHERE id = NEW.session_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE sessions 
      SET booked_count = booked_count - 1,
          trial_booked_count = trial_booked_count - CASE WHEN OLD.is_trial THEN 1 ELSE 0 END
      WHERE id = OLD.session_id;
    END IF;
    
  -- When a confirmed booking is deleted
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE sessions 
    SET booked_count = booked_count - 1,
        trial_booked_count = trial_booked_count - CASE WHEN OLD.is_trial THEN 1 ELSE 0 END
    WHERE id = OLD.session_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 3. Backfill data to ensure accuracy for existing sessions
UPDATE sessions s
SET trial_booked_count = (
  SELECT COUNT(*) FROM bookings b 
  WHERE b.session_id = s.id AND b.status = 'confirmed' AND b.is_trial = true
);
