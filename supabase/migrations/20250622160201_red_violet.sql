/*
  # Create market_data table for live market information

  1. New Tables
    - `market_data`
      - `id` (uuid, primary key)
      - `pair` (text) - Trading pair like XAU/USD, EUR/USD
      - `price` (numeric) - Current price
      - `change` (numeric) - Price change
      - `change_percent` (numeric) - Percentage change
      - `high` (numeric) - Daily high
      - `low` (numeric) - Daily low
      - `volume` (text) - Trading volume
      - `updated_at` (timestamptz) - Last update time
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `market_data` table
    - Add policy for public read access
    - Add policy for service role write access

  3. Sample Data
    - Insert realistic market data for Gold, Silver, and major forex pairs
*/

CREATE TABLE IF NOT EXISTS market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL UNIQUE,
  price numeric NOT NULL,
  change numeric NOT NULL DEFAULT 0,
  change_percent numeric NOT NULL DEFAULT 0,
  high numeric NOT NULL,
  low numeric NOT NULL,
  volume text NOT NULL DEFAULT '0',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on market_data"
  ON market_data
  FOR SELECT
  TO public
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role write access on market_data"
  ON market_data
  FOR ALL
  TO service_role
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_market_data_pair ON market_data(pair);
CREATE INDEX IF NOT EXISTS idx_market_data_updated_at ON market_data(updated_at);

-- Insert sample market data
INSERT INTO market_data (pair, price, change, change_percent, high, low, volume) VALUES
  ('XAU/USD', 2345.67, 12.34, 0.53, 2356.89, 2334.12, '2.4M'),
  ('XAG/USD', 29.45, -0.23, -0.77, 29.78, 29.12, '1.8M'),
  ('EUR/USD', 1.0867, 0.0023, 0.21, 1.0890, 1.0845, '3.2M'),
  ('GBP/USD', 1.2634, -0.0012, -0.09, 1.2650, 1.2620, '2.1M'),
  ('USD/JPY', 149.67, 0.45, 0.30, 150.12, 149.23, '1.9M'),
  ('AUD/USD', 0.6542, 0.0018, 0.28, 0.6560, 0.6525, '1.5M')
ON CONFLICT (pair) DO UPDATE SET
  price = EXCLUDED.price,
  change = EXCLUDED.change,
  change_percent = EXCLUDED.change_percent,
  high = EXCLUDED.high,
  low = EXCLUDED.low,
  volume = EXCLUDED.volume,
  updated_at = now();