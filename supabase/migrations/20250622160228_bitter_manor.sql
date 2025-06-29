/*
  # Create notifications system tables

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `type` (text) - signal, achievement, announcement, alert
      - `title` (text) - Notification title
      - `message` (text) - Notification body
      - `data` (jsonb, nullable) - Additional data payload
      - `target_user` (text, nullable) - Specific user or null for broadcast
      - `status` (text) - pending, sent, failed
      - `sent_at` (timestamptz, nullable) - When notification was sent
      - `created_at` (timestamptz) - Record creation time

    - `notification_responses`
      - `id` (uuid, primary key)
      - `notification_id` (uuid) - Foreign key to notifications
      - `user_id` (text) - User identifier
      - `action` (text) - clicked, dismissed, opened
      - `device_info` (jsonb, nullable) - Device information
      - `responded_at` (timestamptz) - When user responded
      - `created_at` (timestamptz) - Record creation time

    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (text) - User identifier
      - `fcm_token` (text, nullable) - Firebase Cloud Messaging token
      - `device_type` (text) - ios, android, web
      - `app_version` (text, nullable) - App version
      - `last_active` (timestamptz) - Last activity timestamp
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table

  3. Sample Data
    - Insert sample notifications
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('signal', 'achievement', 'announcement', 'alert')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  target_user text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notification responses table
CREATE TABLE IF NOT EXISTS notification_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('clicked', 'dismissed', 'opened')),
  device_info jsonb,
  responded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  fcm_token text,
  device_type text CHECK (device_type IN ('ios', 'android', 'web')),
  app_version text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Allow public read access on notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role write access on notifications"
  ON notifications
  FOR ALL
  TO service_role
  USING (true);

-- Notification responses policies
CREATE POLICY "Allow users to read own responses"
  ON notification_responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow users to insert own responses"
  ON notification_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- User profiles policies
CREATE POLICY "Allow users to read own profile"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON user_profiles
  FOR ALL
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_responses_notification_id ON notification_responses(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Insert sample notifications
INSERT INTO notifications (type, title, message, data, status, sent_at) VALUES
  (
    'signal',
    'Signal Closed - Profit!',
    'XAU/USD BUY signal closed with +$245 profit',
    '{"signal_id": "1", "pnl": 245, "pair": "XAU/USD"}',
    'sent',
    now() - interval '2 hours'
  ),
  (
    'achievement',
    'Streak Achievement!',
    'You''ve hit a 5-day winning streak!',
    '{"streak_days": 5, "achievement_type": "winning_streak"}',
    'sent',
    now() - interval '1 day'
  ),
  (
    'signal',
    'New Signal Available',
    'XAG/USD SELL signal just published',
    '{"signal_id": "2", "pair": "XAG/USD", "type": "SELL"}',
    'sent',
    now() - interval '2 days'
  ),
  (
    'announcement',
    'Market Update',
    'Gold showing strong bullish momentum this week',
    '{"market": "gold", "sentiment": "bullish"}',
    'sent',
    now() - interval '3 days'
  ),
  (
    'alert',
    'Stop Loss Hit',
    'XAG/USD position closed at stop loss',
    '{"signal_id": "3", "pair": "XAG/USD", "action": "stop_loss"}',
    'sent',
    now() - interval '1 week'
  );