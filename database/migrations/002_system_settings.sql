-- ============================================================
-- Phase 3: System Settings Table & RLS
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- 1. Ensure the table has a PRIMARY KEY (Important for Upsert to work!)
-- First, check if primary key exists. If not, add it.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE contype = 'p' AND conrelid = 'system_settings'::regclass
  ) THEN
    ALTER TABLE public.system_settings ADD PRIMARY KEY (key);
  END IF;
END $$;

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anonymous read (so the booking app can read settings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' AND policyname = 'Allow anonymous read system_settings'
  ) THEN
    CREATE POLICY "Allow anonymous read system_settings"
      ON public.system_settings
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- 4. Policy: Allow authenticated full access (Admin can update settings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' AND policyname = 'Allow authenticated full access system_settings'
  ) THEN
    CREATE POLICY "Allow authenticated full access system_settings"
      ON public.system_settings
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Insert default values (Cut-off = 7, Capacity = 12)
INSERT INTO public.system_settings (key, value)
VALUES 
  ('cutoff_hour', '7'),
  ('default_capacity', '12')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
