/*
  # Create automatic notification trigger system

  1. Database Function
    - `handle_new_notification()` - Triggers when new notification is inserted
    - Calls Edge Function to send push notifications
    - Handles error logging

  2. Trigger
    - `trigger_new_notification` - Executes after INSERT on notifications table
    - Automatically processes new notifications

  3. Logging Table
    - `notification_logs` - Tracks notification delivery status
    - Helps with debugging and monitoring

  4. Security
    - Uses service role for Edge Function calls
    - Proper error handling and logging
*/

-- Create notification logs table for debugging and monitoring
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notification logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage logs
CREATE POLICY "Allow service role access to notification_logs"
  ON notification_logs
  FOR ALL
  TO service_role
  USING (true);

-- Allow public read access for debugging
CREATE POLICY "Allow public read access to notification_logs"
  ON notification_logs
  FOR SELECT
  TO public
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Function to handle new notifications
CREATE OR REPLACE FUNCTION handle_new_notification()
RETURNS trigger AS $$
DECLARE
  response_status integer;
  response_body text;
  project_url text;
  service_key text;
BEGIN
  -- Get project URL and service key from environment
  -- Note: In production, these should be set as Supabase secrets
  project_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If environment variables are not set, use placeholders
  -- You'll need to update these with your actual values
  IF project_url IS NULL THEN
    project_url := 'https://your-project-id.supabase.co';
  END IF;
  
  IF service_key IS NULL THEN
    service_key := 'your-service-role-key';
  END IF;

  -- Log the attempt
  INSERT INTO notification_logs (notification_id, status, result)
  VALUES (NEW.id, 'pending', jsonb_build_object('trigger_time', now()));

  BEGIN
    -- Call the Edge Function to send push notification
    SELECT status, content INTO response_status, response_body
    FROM http((
      'POST',
      project_url || '/functions/v1/send-push-notification',
      ARRAY[
        http_header('Authorization', 'Bearer ' || service_key),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      jsonb_build_object(
        'type', NEW.type,
        'title', NEW.title,
        'message', NEW.message,
        'data', NEW.data,
        'target_user', NEW.target_user
      )::text
    ));

    -- Update log with success
    UPDATE notification_logs 
    SET 
      status = 'sent',
      result = jsonb_build_object(
        'http_status', response_status,
        'response', response_body,
        'completed_at', now()
      )
    WHERE notification_id = NEW.id AND status = 'pending';

  EXCEPTION WHEN OTHERS THEN
    -- Update log with error
    UPDATE notification_logs 
    SET 
      status = 'failed',
      error_message = SQLERRM,
      result = jsonb_build_object(
        'error', SQLERRM,
        'failed_at', now()
      )
    WHERE notification_id = NEW.id AND status = 'pending';
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_new_notification ON public.notifications;

-- Create the trigger
CREATE TRIGGER trigger_new_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_notification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.notification_logs TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.notifications TO postgres, anon, authenticated, service_role;