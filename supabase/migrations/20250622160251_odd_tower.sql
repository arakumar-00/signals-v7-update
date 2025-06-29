/*
  # Create technical_indicators table for dynamic chart indicators

  1. New Tables
    - `technical_indicators`
      - `id` (uuid, primary key)
      - `pair` (text) - Trading pair
      - `indicator_name` (text) - RSI, MACD, ADX, etc.
      - `value` (text) - Current indicator value
      - `status` (text) - Buy, Sell, Neutral, etc.
      - `color` (text) - Display color
      - `timeframe` (text) - 1H, 4H, 1D, etc.
      - `updated_at` (timestamptz) - Last update time
      - `created_at` (timestamptz) - Record creation time

    - `economic_events`
      - `id` (uuid, primary key)
      - `time` (text) - Event time
      - `impact` (text) - high, medium, low
      - `currency` (text) - USD, EUR, GBP, etc.
      - `event_name` (text) - Event description
      - `forecast` (text) - Forecasted value
      - `previous` (text) - Previous value
      - `actual` (text, nullable) - Actual value when released
      - `event_date` (date) - Event date
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for service role write access

  3. Sample Data
    - Insert technical indicators for major pairs
    - Insert economic events calendar
*/

-- Technical indicators table
CREATE TABLE IF NOT EXISTS technical_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL,
  indicator_name text NOT NULL,
  value text NOT NULL,
  status text NOT NULL,
  color text NOT NULL,
  timeframe text NOT NULL DEFAULT '1H',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Economic events table
CREATE TABLE IF NOT EXISTS economic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time text NOT NULL,
  impact text NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  currency text NOT NULL,
  event_name text NOT NULL,
  forecast text NOT NULL,
  previous text NOT NULL,
  actual text,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE technical_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;

-- Technical indicators policies
CREATE POLICY "Allow public read access on technical_indicators"
  ON technical_indicators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role write access on technical_indicators"
  ON technical_indicators
  FOR ALL
  TO service_role
  USING (true);

-- Economic events policies
CREATE POLICY "Allow public read access on economic_events"
  ON economic_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role write access on economic_events"
  ON economic_events
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_technical_indicators_pair ON technical_indicators(pair);
CREATE INDEX IF NOT EXISTS idx_technical_indicators_timeframe ON technical_indicators(timeframe);
CREATE INDEX IF NOT EXISTS idx_economic_events_date ON economic_events(event_date);
CREATE INDEX IF NOT EXISTS idx_economic_events_impact ON economic_events(impact);

-- Insert sample technical indicators
INSERT INTO technical_indicators (pair, indicator_name, value, status, color, timeframe) VALUES
  ('XAU/USD', 'RSI', '61.2', 'Neutral', '#888888', '1H'),
  ('XAU/USD', 'MACD', '+2.3', 'Buy', '#00C897', '1H'),
  ('XAU/USD', 'ADX', '25.6', 'Trend Strengthening', '#FFA500', '1H'),
  ('XAG/USD', 'RSI', '45.8', 'Neutral', '#888888', '1H'),
  ('XAG/USD', 'MACD', '-1.2', 'Sell', '#FF4757', '1H'),
  ('XAG/USD', 'ADX', '18.3', 'Weak Trend', '#888888', '1H');

-- Insert sample economic events
INSERT INTO economic_events (time, impact, currency, event_name, forecast, previous, event_date) VALUES
  ('10:30 AM', 'high', 'USD', 'Non-Farm Payrolls', '250K', '200K', CURRENT_DATE),
  ('12:00 PM', 'medium', 'EUR', 'ECB Interest Rate Decision', '1.25%', '1.00%', CURRENT_DATE),
  ('3:45 PM', 'low', 'JPY', 'BoJ Press Conference', '-', '-', CURRENT_DATE),
  ('8:30 AM', 'high', 'USD', 'CPI m/m', '0.3%', '0.2%', CURRENT_DATE + 1),
  ('10:00 AM', 'medium', 'EUR', 'German GDP q/q', '0.1%', '0.0%', CURRENT_DATE + 1);