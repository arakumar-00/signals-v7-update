/*
  # Update user_profiles table structure

  1. Table Updates
    - Ensure all required columns exist in user_profiles table
    - Add missing columns safely with proper defaults
    - Update existing records with proper default values

  2. Constraints
    - Add unique constraint on user_id
    - Add check constraints for device_type and language validation

  3. Indexes
    - Create performance indexes for common queries
    - Ensure unique index on user_id

  4. Security
    - Enable RLS on user_profiles table
    - Create comprehensive policies for device-based access
*/

-- Ensure the user_profiles table exists with base structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add columns safely if they don't exist
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN name text;
  END IF;

  -- Add dob column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dob'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN dob date;
  END IF;

  -- Add language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN language text DEFAULT 'en';
  END IF;

  -- Add onboarding_completed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  -- Add fcm_token column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'fcm_token'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN fcm_token text;
  END IF;

  -- Add device_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN device_type text;
  END IF;

  -- Add app_version column if it doesn't exist (FIXED: correct table_name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'app_version'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN app_version text;
  END IF;

  -- Add last_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN last_active timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure user_id is unique (safe operation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add check constraint for device_type (safe operation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_device_type_check'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_device_type_check 
    CHECK (device_type IN ('ios', 'android', 'web'));
  END IF;
END $$;

-- Add check constraint for language codes (safe operation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_language_check'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_language_check 
    CHECK (language IN ('en', 'es', 'fr', 'de', 'hi', 'zh', 'ja', 'ar'));
  END IF;
END $$;

-- Create indexes for performance (safe operations)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON public.user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active 
ON public.user_profiles(last_active);

CREATE INDEX IF NOT EXISTS idx_user_profiles_language 
ON public.user_profiles(language);

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON public.user_profiles(onboarding_completed);

-- Enable Row Level Security (safe operation)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for device-based access (safe operations)
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Allow device-based access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow anonymous device access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow users to read own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON public.user_profiles;

  -- Create comprehensive policies for all access patterns
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

-- Update existing records to have proper defaults (safe operation)
UPDATE public.user_profiles 
SET 
  language = COALESCE(language, 'en'),
  onboarding_completed = COALESCE(onboarding_completed, false),
  last_active = COALESCE(last_active, now())
WHERE language IS NULL OR onboarding_completed IS NULL OR last_active IS NULL;