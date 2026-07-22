-- Enable Realtime & REPLICA IDENTITY FULL for session_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'session_templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_templates;
  END IF;
END $$;

ALTER TABLE public.session_templates REPLICA IDENTITY FULL;
