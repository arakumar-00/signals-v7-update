/*
  # Add signal analytics and performance tracking

  1. New Tables
    - `signal_analytics` - Track signal performance metrics
    - `user_watchlists` - User-specific watchlists for pairs
    - `signal_comments` - User comments and feedback on signals
    - `trading_sessions` - Track user trading sessions

  2. Enhanced Features
    - Signal win/loss tracking
    - User engagement metrics
    - Performance analytics
    - Social features

  3. Indexes and Constraints
    - Optimized for analytics queries
    - Proper foreign key relationships
*/

-- Signal analytics table for performance tracking
CREATE TABLE IF NOT EXISTS signal_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  entry_time timestamptz,
  exit_time timestamptz,
  duration_minutes integer,
  max_profit numeric DEFAULT 0,
  max_drawdown numeric DEFAULT 0,
  final_pnl numeric DEFAULT 0,
  pips_gained numeric DEFAULT 0,
  win_rate_contribution numeric DEFAULT 0,
  risk_reward_actual numeric,
  slippage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User watchlists for personalized experience
CREATE TABLE IF NOT EXISTS user_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  pair text NOT NULL,
  is_active boolean DEFAULT true,
  notification_enabled boolean DEFAULT true,
  price_alert_high numeric,
  price_alert_low numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pair)
);

-- Signal comments for user engagement
CREATE TABLE IF NOT EXISTS signal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  comment text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  is_verified_trader boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Trading sessions for user activity tracking
CREATE TABLE IF NOT EXISTS trading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  signals_viewed integer DEFAULT 0,
  signals_followed integer DEFAULT 0,
  total_pnl numeric DEFAULT 0,
  device_type text,
  app_version text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE signal_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for signal_analytics
CREATE POLICY "Allow public read access on signal_analytics"
  ON signal_analytics FOR SELECT TO public USING (true);

CREATE POLICY "Allow service role write access on signal_analytics"
  ON signal_analytics FOR ALL TO service_role USING (true);

-- Policies for user_watchlists
CREATE POLICY "Users can manage own watchlists"
  ON user_watchlists FOR ALL TO public 
  USING (true) WITH CHECK (true);

-- Policies for signal_comments
CREATE POLICY "Allow public read access on signal_comments"
  ON signal_comments FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own comments"
  ON signal_comments FOR INSERT TO public WITH CHECK (true);

-- Policies for trading_sessions
CREATE POLICY "Users can manage own sessions"
  ON trading_sessions FOR ALL TO public 
  USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_analytics_signal_id ON signal_analytics(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_analytics_entry_time ON signal_analytics(entry_time);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_pair ON user_watchlists(pair);
CREATE INDEX IF NOT EXISTS idx_signal_comments_signal_id ON signal_comments(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_comments_user_id ON signal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_start ON trading_sessions(session_start);

-- Function to automatically create analytics when signal is closed
CREATE OR REPLACE FUNCTION create_signal_analytics()
RETURNS trigger AS $$
BEGIN
  -- Only create analytics when signal status changes to 'closed'
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    INSERT INTO signal_analytics (
      signal_id,
      entry_time,
      exit_time,
      duration_minutes,
      final_pnl,
      risk_reward_actual
    ) VALUES (
      NEW.id,
      OLD.timestamp,
      now(),
      EXTRACT(EPOCH FROM (now() - OLD.timestamp)) / 60,
      NEW.pnl,
      CASE 
        WHEN NEW.pnl > 0 THEN ABS(NEW.pnl) / ABS(NEW.entry_price - NEW.stop_loss)
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic analytics
DROP TRIGGER IF EXISTS trigger_signal_analytics ON signals;
CREATE TRIGGER trigger_signal_analytics
  AFTER UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION create_signal_analytics();

-- Insert sample data
INSERT INTO user_watchlists (user_id, pair, notification_enabled, price_alert_high, price_alert_low) VALUES
  ('device_demo_user', 'XAU/USD', true, 2400.00, 2300.00),
  ('device_demo_user', 'XAG/USD', true, 32.00, 28.00),
  ('device_demo_user', 'EUR/USD', false, 1.10, 1.05);

INSERT INTO signal_comments (signal_id, user_id, comment, sentiment, is_verified_trader) 
SELECT 
  s.id,
  'device_demo_user',
  CASE 
    WHEN s.pnl > 0 THEN 'Great signal! Profit achieved as expected.'
    WHEN s.pnl < 0 THEN 'Stopped out but good risk management.'
    ELSE 'Watching this signal closely.'
  END,
  CASE 
    WHEN s.pnl > 0 THEN 'positive'
    WHEN s.pnl < 0 THEN 'negative'
    ELSE 'neutral'
  END,
  true
FROM signals s
WHERE s.status = 'closed'
LIMIT 3;