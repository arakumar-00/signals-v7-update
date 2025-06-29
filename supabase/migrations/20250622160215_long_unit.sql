/*
  # Create setup_steps table for dynamic onboarding guide

  1. New Tables
    - `setup_steps`
      - `id` (uuid, primary key)
      - `title` (text) - Step title
      - `description` (text) - Step description
      - `action_text` (text) - Button text
      - `code_sample` (text, nullable) - Code example
      - `step_order` (integer) - Display order
      - `is_active` (boolean) - Whether step is shown
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `setup_steps` table
    - Add policy for public read access
    - Add policy for service role write access

  3. Sample Data
    - Insert Supabase setup steps from the existing guide
*/

CREATE TABLE IF NOT EXISTS setup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  action_text text NOT NULL,
  code_sample text,
  step_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE setup_steps ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on setup_steps"
  ON setup_steps
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow service role to manage steps
CREATE POLICY "Allow service role write access on setup_steps"
  ON setup_steps
  FOR ALL
  TO service_role
  USING (true);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_setup_steps_order ON setup_steps(step_order);

-- Insert setup guide steps
INSERT INTO setup_steps (title, description, action_text, code_sample, step_order) VALUES
  (
    'Create Supabase Project',
    'Sign up at supabase.com and create a new project',
    'Visit supabase.com',
    NULL,
    1
  ),
  (
    'Get Project Credentials',
    'Navigate to Settings > API in your Supabase dashboard',
    'Copy Project URL',
    'https://your-project-id.supabase.co',
    2
  ),
  (
    'Copy Anon Key',
    'Copy the ''anon public'' key from the API settings',
    'Copy Anon Key',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    3
  ),
  (
    'Create Environment File',
    'Create a .env file in your project root with your credentials',
    'Copy .env Template',
    'EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here',
    4
  ),
  (
    'Run Database Migrations',
    'Execute the SQL migrations in your Supabase SQL editor',
    'View Migration Files',
    'supabase/migrations/*.sql',
    5
  );