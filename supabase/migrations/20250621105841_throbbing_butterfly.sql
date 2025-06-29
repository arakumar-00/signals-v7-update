/*
  # Create signals table for forex trading signals

  1. New Tables
    - `signals`
      - `id` (uuid, primary key)
      - `pair` (text) - Currency pair like EUR/USD
      - `type` (text) - BUY or SELL
      - `entry_price` (numeric) - Entry price for the signal
      - `current_price` (numeric) - Current market price
      - `take_profit_levels` (numeric[]) - Array of take profit levels
      - `stop_loss` (numeric) - Stop loss level
      - `status` (text) - active, closed, or pending
      - `accuracy` (numeric) - Signal accuracy percentage
      - `timestamp` (timestamptz) - When signal was created
      - `description` (text) - Signal description
      - `risk_reward` (text) - Risk to reward ratio
      - `pnl` (numeric) - Profit and loss
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `signals` table
    - Add policy for public read access (since this is a demo app)
*/

CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL,
  type text NOT NULL CHECK (type IN ('BUY', 'SELL')),
  entry_price numeric NOT NULL,
  current_price numeric,
  take_profit_levels numeric[] NOT NULL,
  stop_loss numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'closed', 'pending')),
  accuracy numeric NOT NULL DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  description text,
  risk_reward text,
  pnl numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Allow public read access for demo purposes
CREATE POLICY "Allow public read access on signals"
  ON signals
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert for demo purposes (you might want to restrict this in production)
CREATE POLICY "Allow public insert on signals"
  ON signals
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert sample data
INSERT INTO signals (
  pair, type, entry_price, current_price, take_profit_levels, stop_loss, status, accuracy, description, risk_reward, pnl
) VALUES
  ('EUR/USD', 'BUY', 1.0845, 1.0867, ARRAY[1.0890, 1.0920, 1.0950], 1.0820, 'active', 85.2, 'EUR showing strength after ECB dovish comments. Technical breakout above 1.0840 resistance.', '1:3', 110.00),
  ('GBP/JPY', 'SELL', 189.45, 188.92, ARRAY[188.20, 187.50, 186.80], 190.20, 'active', 76.8, 'GBP/JPY showing bearish divergence on H4. Expecting correction to 188.00 level.', '1:2.5', 265.00),
  ('USD/CAD', 'BUY', 1.3456, 1.3421, ARRAY[1.3520, 1.3580], 1.3390, 'active', 68.4, 'USD strength expected ahead of NFP data. Oil weakness supporting USD/CAD upside.', '1:2', -175.00),
  ('AUD/USD', 'SELL', 0.6578, NULL, ARRAY[0.6520, 0.6480], 0.6620, 'closed', 92.1, 'AUD weakness on China concerns. Target achieved at 0.6520.', '1:1.8', 290.00),
  ('EUR/GBP', 'BUY', 0.8601, NULL, ARRAY[0.8650, 0.8690], 0.8560, 'pending', 74.3, 'EUR outperforming GBP. Waiting for entry confirmation at 0.8601.', '1:2.2', NULL);