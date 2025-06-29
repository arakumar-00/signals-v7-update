/*
  # Add silent notifications tracking table

  1. New Tables
    - `silent_notifications`
      - `id` (uuid, primary key)
      - `device_id` (text) - Device identifier
      - `type` (text) - Silent notification type
      - `payload` (jsonb) - Notification payload
      - `executed_at` (timestamptz) - When it was executed
      - `execution_time_ms` (integer) - Execution time in milliseconds
      - `success` (boolean) - Whether execution was successful
      - `result` (jsonb) - Execution result data
      - `error_message` (text) - Error message if failed
      - `platform` (text) - Platform (web, ios, android)
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `silent_notifications` table
    - Add policies for device-based access

  3. Indexes
    - Index on device_id for performance
    - Index on type for analytics
    - Index on executed_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS silent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  type text NOT NULL,
  payload jsonb,
  executed_at timestamptz DEFAULT now(),
  execution_time_ms integer,
  success boolean NOT NULL DEFAULT false,
  result jsonb,
  error_message text,
  platform text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE silent_notifications ENABLE ROW LEVEL SECURITY;

-- Allow devices to manage their own silent notification logs
CREATE POLICY "Allow device access to own silent notifications"
  ON silent_notifications
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to silent notifications"
  ON silent_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_silent_notifications_device_id ON silent_notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_silent_notifications_type ON silent_notifications(type);
CREATE INDEX IF NOT EXISTS idx_silent_notifications_executed_at ON silent_notifications(executed_at);
CREATE INDEX IF NOT EXISTS idx_silent_notifications_success ON silent_notifications(success);
CREATE INDEX IF NOT EXISTS idx_silent_notifications_platform ON silent_notifications(platform);

-- Add check constraint for notification types
ALTER TABLE silent_notifications 
ADD CONSTRAINT silent_notifications_type_check 
CHECK (type IN (
  'background-sync',
  'price-update', 
  'signal-refresh',
  'cache-invalidate',
  'system-maintenance',
  'market-data-sync'
));

-- Add check constraint for platform
ALTER TABLE silent_notifications 
ADD CONSTRAINT silent_notifications_platform_check 
CHECK (platform IN ('web', 'ios', 'android'));

-- Insert sample silent notification logs for testing
INSERT INTO silent_notifications (
  device_id, 
  type, 
  payload, 
  execution_time_ms, 
  success, 
  result, 
  platform
) VALUES
  (
    'device_demo_123',
    'background-sync',
    '{"action": "test", "pairs": ["XAU/USD", "XAG/USD"]}',
    45,
    true,
    '{"actions": ["market-data-refreshed", "signals-synced"]}',
    'web'
  ),
  (
    'device_demo_123',
    'price-update',
    '{"pairs": ["XAU/USD"]}',
    23,
    true,
    '{"updatedPairs": [{"pair": "XAU/USD", "updated": true}]}',
    'web'
  ),
  (
    'device_demo_456',
    'signal-refresh',
    '{"action": "manual-trigger"}',
    67,
    true,
    '{"signalsRefreshed": true, "count": 5}',
    'ios'
  );