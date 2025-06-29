/*
  # Clean up user_profiles table - Remove profile fields, keep only FCM

  1. Remove Profile Columns
    - Drop name, dob, language, onboarding_completed columns
    - Keep only FCM and device management fields

  2. Remove Constraints
    - Drop language and other profile-related constraints
    - Keep device_type constraint

  3. Update Policies
    - Simplify policies for FCM token management only
*/

-- Remove profile-related columns
DO $$
BEGIN
  -- Drop name column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN name;
  END IF;

  -- Drop dob column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dob'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN dob;
  END IF;

  -- Drop language column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN language;
  END IF;

  -- Drop onboarding_completed column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN onboarding_completed;
  END IF;
END $$;

-- Remove profile-related constraints
DO $$
BEGIN
  -- Drop language constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_language_check'
  ) THEN
    ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_language_check;
  END IF;
END $$;

-- Remove profile-related indexes
DROP INDEX IF EXISTS idx_user_profiles_language;
DROP INDEX IF EXISTS idx_user_profiles_onboarding;

-- Keep only essential indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON public.user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active 
ON public.user_profiles(last_active);

-- Update policies for FCM-only access
DO $$
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Allow device-based access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow anonymous device access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow users to read own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow all device-based actions" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow service role full access" ON public.user_profiles;

  -- Create simple policies for FCM token management
  CREATE POLICY "Allow all device-based actions" 
  ON public.user_profiles
  FOR ALL 
  TO anon
  USING (true) 
  WITH CHECK (true);

  CREATE POLICY "Allow authenticated users full access" 
  ON public.user_profiles
  FOR ALL 
  TO authenticated
  USING (true) 
  WITH CHECK (true);

  CREATE POLICY "Allow service role full access" 
  ON public.user_profiles
  FOR ALL 
  TO service_role
  USING (true) 
  WITH CHECK (true);
END $$;