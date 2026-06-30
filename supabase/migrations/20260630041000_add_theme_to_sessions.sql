-- Add theme and activity_desc to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS theme text,
ADD COLUMN IF NOT EXISTS activity_desc text;
