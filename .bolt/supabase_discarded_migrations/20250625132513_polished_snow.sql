/*
  # Complete backend system for automated trading signals

  1. Enhanced Tables
    - Update existing tables with new fields
    - Add price_summary table for live market data
    - Add system_config for API management

  2. Automated Functions
    - Signal processing logic
    - Price comparison functions
    - Status update triggers

  3. Indexes and Performance
    - Optimized for real-time queries
    - Efficient batch updates
*/

-- Create price_summary table for live market data
CREATE TABLE IF NOT EXISTS price_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL UNIQUE,
  current_price numeric NOT NULL,
  high_price numeric NOT NULL,
  low_price numeric NOT NULL,
  open_price numeric NOT NULL,
  volume text DEFAULT '0',
  change_amount numeric DEFAULT 0,
  change_percent numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create system_config table for API management
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policies for price_summary
CREATE POLICY "Allow public read access on price_summary"
  ON price_summary FOR SELECT TO public USING (true);

CREATE POLICY "Allow service role write access on price_summary"
  ON price_summary FOR ALL TO service_role USING (true);

-- Policies for system_config
CREATE POLICY "Allow public read access on system_config"
  ON system_config FOR SELECT TO public USING (true);

CREATE POLICY "Allow service role write access on system_config"
  ON system_config FOR ALL TO service_role USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_summary_pair ON price_summary(pair);
CREATE INDEX IF NOT EXISTS idx_price_summary_updated_at ON price_summary(updated_at);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Add new columns to signals table if they don't exist
DO $$
BEGIN
  -- Add tp_hit column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'tp_hit'
  ) THEN
    ALTER TABLE signals ADD COLUMN tp_hit boolean DEFAULT false;
  END IF;

  -- Add sl_hit column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'sl_hit'
  ) THEN
    ALTER TABLE signals ADD COLUMN sl_hit boolean DEFAULT false;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signals' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE signals ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Function to update signal status based on current price
CREATE OR REPLACE FUNCTION update_signal_status()
RETURNS trigger AS $$
DECLARE
  current_market_price numeric;
BEGIN
  -- Get current market price for this pair
  SELECT current_price INTO current_market_price
  FROM price_summary
  WHERE pair = NEW.pair;

  -- Only process if we have a current price
  IF current_market_price IS NOT NULL THEN
    -- Check for BUY signals
    IF NEW.type = 'BUY' THEN
      -- Check if take profit hit
      IF current_market_price >= ANY(NEW.take_profit_levels) AND NOT NEW.tp_hit THEN
        NEW.tp_hit = true;
        NEW.status = 'closed';
        NEW.pnl = (current_market_price - NEW.entry_price) * 100; -- Simplified PnL calculation
      -- Check if stop loss hit
      ELSIF current_market_price <= NEW.stop_loss AND NOT NEW.sl_hit THEN
        NEW.sl_hit = true;
        NEW.status = 'closed';
        NEW.pnl = (current_market_price - NEW.entry_price) * 100; -- Simplified PnL calculation
      END IF;
    
    -- Check for SELL signals
    ELSIF NEW.type = 'SELL' THEN
      -- Check if take profit hit (price goes down)
      IF current_market_price <= ANY(NEW.take_profit_levels) AND NOT NEW.tp_hit THEN
        NEW.tp_hit = true;
        NEW.status = 'closed';
        NEW.pnl = (NEW.entry_price - current_market_price) * 100; -- Simplified PnL calculation
      -- Check if stop loss hit (price goes up)
      ELSIF current_market_price >= NEW.stop_loss AND NOT NEW.sl_hit THEN
        NEW.sl_hit = true;
        NEW.status = 'closed';
        NEW.pnl = (NEW.entry_price - current_market_price) * 100; -- Simplified PnL calculation
      END IF;
    END IF;

    -- Update current price and timestamp
    NEW.current_price = current_market_price;
    NEW.updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic signal status updates
DROP TRIGGER IF EXISTS trigger_update_signal_status ON signals;
CREATE TRIGGER trigger_update_signal_status
  BEFORE UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_status();

-- Insert initial system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
  ('api_key_twelvedata', '31641cdf778946eba18e6689bb4d175d', 'TwelveData API key for market data'),
  ('update_interval_signals', '5', 'Signal update interval in minutes'),
  ('update_interval_indicators', '15', 'Technical indicators update interval in minutes'),
  ('supported_pairs', 'XAU/USD,XAG/USD,BTC/USD,EUR/USD', 'Comma-separated list of supported trading pairs'),
  ('last_price_update', '', 'Timestamp of last price update'),
  ('last_indicator_update', '', 'Timestamp of last indicator update')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now();

-- Insert initial price data
INSERT INTO price_summary (pair, current_price, high_price, low_price, open_price, volume) VALUES
  ('XAU/USD', 2345.67, 2356.89, 2334.12, 2340.00, '2.4M'),
  ('XAG/USD', 29.45, 29.78, 29.12, 29.30, '1.8M'),
  ('BTC/USD', 43250.00, 43800.00, 42900.00, 43100.00, '1.2B'),
  ('EUR/USD', 1.0867, 1.0890, 1.0845, 1.0850, '3.2M')
ON CONFLICT (pair) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  high_price = EXCLUDED.high_price,
  low_price = EXCLUDED.low_price,
  open_price = EXCLUDED.open_price,
  volume = EXCLUDED.volume,
  updated_at = now();