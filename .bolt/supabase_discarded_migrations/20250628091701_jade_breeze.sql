/*
  # Create user_profiles table for device-based authentication

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (text, unique) - Device ID used as unique identifier
      - `name` (text) - User's full name
      - `dob` (date) - Date of birth
      - `language` (text) - Preferred language code (default: 'en')
      - `onboarding_completed` (boolean) - Whether onboarding is completed
      - `fcm_token` (text) - Firebase token for push notifications
      - `device_type` (text) - Device type: 'ios', 'android', or 'web'
      - `app_version` (text) - App version (e.g., '1.0.0')
      - `last_active` (timestamptz) - Last activity timestamp
      - `created_at` (timestamptz) - Row creation time

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for device-based access (no authentication required)

  3. Indexes
    - Unique index on `user_id` for performance
    - Index on `last_active` for analytics queries
</sql>

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  name text,
  dob date,
  language text DEFAULT 'en',
  onboarding_completed boolean DEFAULT false,
  fcm_token text,
  device_type text,
  app_version text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add check constraint for device_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_device_type_check'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_device_type_check 
    CHECK (device_type IN ('ios', 'android', 'web'));
  END IF;
END $$;

-- Add check constraint for language codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_language_check'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_language_check 
    CHECK (language IN ('en', 'es', 'fr', 'de', 'hi', 'zh', 'ja', 'ar'));
  END IF;
END $$;

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON public.user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active 
ON public.user_profiles(last_active);

CREATE INDEX IF NOT EXISTS idx_user_profiles_language 
ON public.user_profiles(language);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for device-based access (no authentication required)
CREATE POLICY IF NOT EXISTS "Allow device-based access" 
ON public.user_profiles
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policy for anonymous users (more specific)
CREATE POLICY IF NOT EXISTS "Allow anonymous device access" 
ON public.user_profiles
FOR ALL 
TO anon
USING (true) 
WITH CHECK (true);

-- Create policy for authenticated users (if needed later)
CREATE POLICY IF NOT EXISTS "Allow authenticated access" 
ON public.user_profiles
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);