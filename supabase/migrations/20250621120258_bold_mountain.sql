/*
  # Fix duplicate policy errors

  This migration removes existing policies and recreates them to resolve
  the "policy already exists" error.

  1. Drop existing policies if they exist
  2. Recreate policies with proper permissions
  3. Ensure RLS is enabled
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on signals" ON public.signals;
DROP POLICY IF EXISTS "Allow public insert on signals" ON public.signals;

-- Recreate the policies
CREATE POLICY "Allow public read access on signals"
  ON public.signals
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on signals"
  ON public.signals
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;