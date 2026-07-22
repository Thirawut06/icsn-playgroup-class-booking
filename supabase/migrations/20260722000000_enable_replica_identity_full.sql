-- Enable REPLICA IDENTITY FULL for realtime tables so UPDATE/DELETE events trigger RLS-filtered broadcasts
ALTER TABLE public.school_closures REPLICA IDENTITY FULL;
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;
ALTER TABLE public.slip_uploads REPLICA IDENTITY FULL;
