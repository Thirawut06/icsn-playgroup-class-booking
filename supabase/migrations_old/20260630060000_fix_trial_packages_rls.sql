-- Migration to allow authenticated users to insert their own trial package during registration
-- and prevent abuse by limiting to one trial package per parent.

-- 1. Allow inserting trial packages
CREATE POLICY "Users can insert own trial package" 
ON public.packages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  parent_id = auth.uid() AND 
  type = 'trial' AND 
  credits_remaining = 1
);

-- 2. Prevent abuse (multiple free trials) using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_trial_package ON public.packages (parent_id) WHERE type = 'trial';
