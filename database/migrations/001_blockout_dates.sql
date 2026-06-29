-- ============================================================
-- Phase 1: Blockout Dates Table
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- Table: blockout_dates
-- Stores dates that admins have blocked from booking (holidays, special closures)
CREATE TABLE IF NOT EXISTS public.blockout_dates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_date date NOT NULL UNIQUE,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (Row Level Security) but allow all access since this is admin-managed
ALTER TABLE public.blockout_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read (needed for booking page to check blockout dates)
CREATE POLICY "Allow anonymous read blockout_dates"
  ON public.blockout_dates
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow authenticated full access (admin operations)
CREATE POLICY "Allow authenticated full access blockout_dates"
  ON public.blockout_dates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anon full access (since we use anon key with admin password check)
CREATE POLICY "Allow anon full access blockout_dates"
  ON public.blockout_dates
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
